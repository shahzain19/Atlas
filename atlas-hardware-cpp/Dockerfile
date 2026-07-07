FROM ubuntu:22.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake g++-12 libv4l-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY . .

RUN mkdir -p build && cmake -S . -B build -DCMAKE_CXX_COMPILER=g++-12 && \
    cmake --build build -j$(nproc) && \
    cp build/atlas_hardware_daemon /atlas_hardware_daemon

FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    libv4l2-0 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /atlas_hardware_daemon /usr/local/bin/atlas_hardware_daemon

RUN mkdir -p /dev/shm

STOPSIGNAL SIGTERM
CMD ["atlas_hardware_daemon"]
