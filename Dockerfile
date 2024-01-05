FROM grafana/k6:latest

USER root

COPY . /app

WORKDIR /app

RUN apk update && \
    apk add openvpn &&\
    apk add curl

ENTRYPOINT [ "sh" ,"/app/entrypoint.sh" ]