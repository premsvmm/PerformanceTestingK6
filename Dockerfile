FROM loadimpact/k6:latest

USER root

COPY . /app

WORKDIR /app

ENTRYPOINT [ "sh" ,"/app/entrypoint.sh" ]