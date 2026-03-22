install:
	npm install

dev:
	npm run dev

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

test-e2e:
	npm run test:e2e

verify:
	npm run verify

docker:
	docker compose up --build app preview
