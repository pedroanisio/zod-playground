FROM node:24-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

RUN pip3 install --no-cache-dir --break-system-packages \
  mkdocs-material==9.6.20 \
  pymdown-extensions==10.16.1 \
  mkdocs-copy-to-llm

WORKDIR /workspace

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN chmod +x docs/_specs/docker/entrypoint.sh \
  && chmod +x docs/_specs/scripts/docker-docs-smoke.sh \
  && chmod +x docs/_specs/scripts/verify-docs-freshness.sh

ENTRYPOINT ["docs/_specs/docker/entrypoint.sh"]
CMD ["build"]
