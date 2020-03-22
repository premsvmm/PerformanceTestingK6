FROM loadimpact/k6:latest

COPY . /app

WORKDIR /app

ENTRYPOINT [ "sh" ,"/app/entrypoint.sh" ]