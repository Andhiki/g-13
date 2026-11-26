import json
import os
import re
import subprocess
import sys


def fail(message):
    raise SystemExit(message)


def is_release(pr):
    base, head = pr["base"], pr["head"]
    return base["ref"] == "main" and (
        head["ref"] == "staging"
        or head["ref"].startswith("hotfix/")
        or any(label["name"].startswith("release:") for label in pr["labels"])
    )


def bump_for(pr):
    repository = os.environ["GITHUB_REPOSITORY"]
    head = pr["head"]
    if pr["base"]["ref"] != "main" or (head.get("repo") or {}).get("full_name") != repository:
        fail("Release PRs must target main from a branch in this repository.")
    if head["ref"] != "staging" and not head["ref"].startswith("hotfix/"):
        fail("Use staging for promotions or a hotfix/* branch for an isolated fix.")
    bumps = [label["name"] for label in pr["labels"] if label["name"] in {
        "release:major", "release:minor", "release:patch",
    }]
    if len(bumps) != 1:
        fail("Apply exactly one release:major, release:minor, or release:patch label.")
    bump = bumps[0].removeprefix("release:")
    if head["ref"].startswith("hotfix/") and bump != "patch":
        fail("Hotfix PRs require the release:patch label.")
    return bump


def version_for(ref, bump, exclude_sha=None):
    tags = subprocess.check_output(
        ["git", "tag", "--merged", ref, "--list", "v*"], text=True
    ).splitlines()
    versions = []
    for tag in tags:
        if not re.fullmatch(r"v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", tag):
            continue
        if exclude_sha and subprocess.check_output(
            ["git", "rev-list", "-1", tag], text=True
        ).strip() == exclude_sha:
            continue
        versions.append(tuple(map(int, tag[1:].split("."))))

    if not versions:
        with open("apps/web/package.json") as package:
            return "v" + json.load(package)["version"]
    major, minor, patch = max(versions)
    return {
        "major": f"v{major + 1}.0.0",
        "minor": f"v{major}.{minor + 1}.0",
        "patch": f"v{major}.{minor}.{patch + 1}",
    }[bump]


if sys.argv[1] == "preview":
    with open(os.environ["GITHUB_EVENT_PATH"]) as event:
        pr = json.load(event)["pull_request"]
    if is_release(pr):
        print("Proposed release:", version_for(pr["base"]["sha"], bump_for(pr)))
else:
    sha = os.environ["GITHUB_SHA"]
    candidates = json.load(sys.stdin)
    matches = [
        pr for pr in candidates
        if pr["base"]["ref"] == "main" and pr.get("merged_at") and pr["merge_commit_sha"] == sha
    ]
    if len(matches) != 1:
        fail("Expected exactly one merged PR into main matching the deployment commit.")
    print(version_for(sha, bump_for(matches[0]), exclude_sha=sha))
