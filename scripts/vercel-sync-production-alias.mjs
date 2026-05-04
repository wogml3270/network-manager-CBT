import { readFile } from "node:fs/promises";

const VERCEL_API_BASE = "https://api.vercel.com";
const DEFAULT_ALIAS_DOMAIN = "network-manager-cbt.vercel.app";
const MAX_POLL_COUNT = 40;
const POLL_INTERVAL_MS = 15_000;

// 지정된 시간만큼 Vercel 배포 상태 확인을 잠시 멈춥니다.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 로컬 Vercel 연결 정보가 있으면 projectId와 teamId를 읽습니다.
async function readLocalProjectMeta() {
  try {
    const raw = await readFile(".vercel/project.json", "utf8");
    const parsed = JSON.parse(raw);

    return {
      projectId: parsed.projectId ?? null,
      teamId: parsed.orgId ?? null,
    };
  } catch {
    return {
      projectId: null,
      teamId: null,
    };
  }
}

// Team 프로젝트일 때 Vercel API query 문자열을 구성합니다.
function buildTeamQuery(teamId) {
  return teamId?.startsWith("team_") ? `teamId=${encodeURIComponent(teamId)}` : "";
}

// Vercel API 호출을 공통화해 실패 응답을 읽기 쉬운 에러로 바꿉니다.
async function fetchVercelJson(path, { token, method = "GET", body, teamId } = {}) {
  const query = buildTeamQuery(teamId);
  const url = query ? `${VERCEL_API_BASE}${path}${path.includes("?") ? "&" : "?"}${query}` : `${VERCEL_API_BASE}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Vercel API ${method} ${path} failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

// GitHub SHA가 일치하고 READY 상태인 production 배포를 우선 선택합니다.
function pickReadyDeployment(deployments, githubSha) {
  if (githubSha) {
    return deployments.find(
      (deployment) =>
        deployment?.meta?.githubCommitSha === githubSha && deployment.readyState === "READY",
    );
  }

  return deployments.find((deployment) => deployment.readyState === "READY");
}

// GitHub push로 생성된 Vercel production 배포가 READY가 될 때까지 기다립니다.
async function waitForDeployment({ token, teamId, projectId, githubSha }) {
  for (let attempt = 1; attempt <= MAX_POLL_COUNT; attempt += 1) {
    const result = await fetchVercelJson(
      `/v6/deployments?projectId=${encodeURIComponent(projectId)}&target=production&limit=20`,
      {
        token,
        teamId,
      },
    );
    const deployments = Array.isArray(result.deployments) ? result.deployments : [];
    const ready = pickReadyDeployment(deployments, githubSha);

    if (ready) {
      return ready;
    }

    if (attempt < MAX_POLL_COUNT) {
      console.log(
        `[alias-sync] waiting deployment... (${attempt}/${MAX_POLL_COUNT}) sha=${githubSha ?? "latest"}`,
      );
      await sleep(POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `[alias-sync] ready production deployment not found. sha=${githubSha ?? "latest"}`,
  );
}

// 최신 production 배포를 고정 Vercel alias로 연결합니다.
async function run() {
  const token = process.env.VERCEL_TOKEN ?? "";
  const aliasDomain = process.env.VERCEL_ALIAS_DOMAIN ?? DEFAULT_ALIAS_DOMAIN;
  const githubSha = process.env.GITHUB_SHA?.trim() || null;

  if (!token) {
    throw new Error("VERCEL_TOKEN is required.");
  }

  const localMeta = await readLocalProjectMeta();
  const projectId = process.env.VERCEL_PROJECT_ID ?? localMeta.projectId;
  const teamId = process.env.VERCEL_TEAM_ID ?? localMeta.teamId;

  if (!projectId) {
    throw new Error("VERCEL_PROJECT_ID is required (or provide .vercel/project.json).");
  }

  const deployment = await waitForDeployment({
    token,
    teamId,
    projectId,
    githubSha,
  });

  console.log(
    `[alias-sync] assigning ${aliasDomain} -> ${deployment.url} (${deployment.id})`,
  );

  await fetchVercelJson(`/v2/deployments/${deployment.id}/aliases`, {
    token,
    method: "POST",
    body: { alias: aliasDomain },
    teamId,
  });

  console.log(`[alias-sync] done: https://${aliasDomain}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
