# AdGuard VPN Browser Extension — Source Code for Firefox Add-ons Review

This archive contains the source code for the AdGuard VPN browser extension,
provided for the Firefox Add-ons review team.

## Prerequisites

You need Docker to build the extension.

- [Docker](https://docs.docker.com/get-docker/)

## Build Instructions

To ensure the extension is built in the same environment as our CI, use the Docker image.

### Beta version

```shell
docker run --rm -it \
    -v $(pwd):/workspace \
    -w /workspace \
    --env-file .env \
    adguard/node-ssh:22.17--0 \
    /bin/sh -c "
        pnpm install && \
        STAGE_ENV=prod \
        pnpm beta firefox"
```

The build output will be located at `build/beta/firefox.zip`.

### Release version

```shell
docker run --rm -it \
    -v $(pwd):/workspace \
    -w /workspace \
    --env-file .env \
    adguard/node-ssh:22.17--0 \
    /bin/sh -c "
        pnpm install && \
        STAGE_ENV=prod \
        pnpm release firefox"
```

The build output will be located at `build/release/firefox.zip`.
