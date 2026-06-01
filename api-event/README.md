# MPJ Event API Submodule

Laravel-only event API module for shared hosting deployment.

Base route:

```text
/api-event/v1/*
```

Install and validate:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan route:list --path=api-event
php artisan migrate
```

Protected routes accept:

```text
Authorization: Bearer <EVENT_API_TOKEN>
```

or:

```text
x-admin-token: <EVENT_API_TOKEN>
```
