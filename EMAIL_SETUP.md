# Email Setup Guide for Voli Website

## Option 1: Firebase Functions (Recommended)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Initialize Firebase Functions
```bash
firebase init functions
```

### Step 3: Update SMTP Settings
Edit `/functions/index.js` and replace:
- `YOUR_SMTP_HOST` with your SMTP server (e.g., smtp.gmail.com)
- `YOUR_SMTP_USER` with your SMTP username
- `YOUR_SMTP_PASSWORD` with your SMTP password

### Step 4: Install Dependencies
```bash
cd functions
npm install
```

### Step 5: Deploy Functions
```bash
firebase deploy --only functions
```

### Step 6: Update JavaScript
After deployment, Firebase will give you function URLs. Update `/js/main.js`:
- Replace `YOUR_FIREBASE_FUNCTION_URL` with the actual function URL

## Option 2: Alternative Solutions

### EmailJS (No Backend Required)
1. Sign up at https://www.emailjs.com
2. Create email service and template
3. Get your public key
4. Update the forms to use EmailJS SDK

### Formspree (Simple Form Handler)
1. Sign up at https://formspree.io
2. Create forms for your email
3. Replace form action with Formspree endpoint

### Netlify Forms (If hosting on Netlify)
1. Add `netlify` attribute to forms
2. Configure form notifications in Netlify dashboard

## SMTP Configuration Examples

### Gmail SMTP
```javascript
host: 'smtp.gmail.com',
port: 587,
secure: false,
auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password' // Use App Password, not regular password
}
```

### SendGrid SMTP
```javascript
host: 'smtp.sendgrid.net',
port: 587,
secure: false,
auth: {
    user: 'apikey',
    pass: 'your-sendgrid-api-key'
}
```

### Custom SMTP Server
```javascript
host: 'mail.yourdomain.com',
port: 587,
secure: false,
auth: {
    user: 'noreply@yourdomain.com',
    pass: 'your-password'
}
```

## Testing Locally

1. Run Firebase emulator:
```bash
firebase emulators:start --only functions
```

2. Update JavaScript to use local function URLs during development

## Security Notes

1. Never commit SMTP credentials to Git
2. Use environment variables in production:
```javascript
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
```

3. Set environment variables in Firebase:
```bash
firebase functions:config:set smtp.host="smtp.gmail.com" smtp.user="email@gmail.com" smtp.pass="password"
```