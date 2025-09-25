# QuantumChat – Client

This is the Vite + React frontend for the QuantumChat application. It powers the authentication flows, chat interface, and EmailJS integrations.

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the sample environment file and populate values
   ```bash
   cp .env.example .env
   ```
3. Run the development server
   ```bash
   npm run dev
   ```

## Required environment variables

The forgot-password flow sends EmailJS messages. Configure these environment variables in `.env`:

| Variable | Description |
| --- | --- |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID used to send transactional emails. |
| `VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID` | Template ID for the **forgot password** email. This must match the template configured in the EmailJS dashboard. |
| `VITE_EMAILJS_TEMPLATE_ID` | (Optional) Template ID used for welcome emails. |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key for the project. |

If any of the required values are missing, the UI surfaces an actionable error instead of calling EmailJS with incomplete credentials.

## Linting
```bash
npm run lint
```

## Build
```bash
npm run build
```
