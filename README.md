# XYZ Shop Data Layer

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
docker compose up -d mongo1 mongo2 mongo3 mongo-init redis
```

```bash
docker compose run --rm api npm run seed
```

```bash
docker compose up -d api mongo-express redis-commander
```

```bash
docker compose ps
```

```bash
npm run test:smoke
```

```bash
npm run test:api
```

```bash
powershell -Command "Get-ChildItem src,scripts,public -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }"
```

```bash
docker compose config
```

```bash
docker compose logs --tail=50 api
```

```bash
docker compose down
```

```text
http://localhost:3000
http://localhost:3000/health
http://localhost:8081
http://localhost:8082
```

```text
admin@xyzshop.test
seller@xyzshop.test
customer1@xyzshop.test
Password123!
```

```text
report.md
docs/system-architecture.md
docs/diagrams/system-architecture.excalidraw
docs/diagrams/system-architecture.puml
docs/demo-script.md
screenshots/
```

```text
https://drive.google.com/drive/folders/1AVTWx4b29AFKXWRLB8Q9Z_kH22AYdd0_?usp=sharing
```
