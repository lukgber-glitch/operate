# Chat E2E Test - Manual Instructions

## Prerequisites
- Local dev server running at http://localhost:3000
- API server running at http://localhost:3001

## Test Steps

### Step 1: Login via Google OAuth

1. Open browser and navigate to: http://localhost:3000/login
2. Click the "Google" button (should redirect to http://localhost:3001/api/v1/auth/google)
3. Complete Google OAuth:
   - Email: luk.gber@gmail.com
   - Password: schlagzeug
4. After successful OAuth, you should be redirected back to the app

### Step 2: Navigate to Chat

1. Go to: http://localhost:3000/chat
2. Verify you are NOT redirected to login (if you are, authentication failed)
3. Take screenshot of the chat page

### Step 3: Find Chat Input

1. Look for a textarea on the page
2. If no textarea is found, the test fails
3. Take screenshot showing the input

### Step 4: Type a Message

1. Click on the textarea
2. Type exactly: "Hello, what can you help me with?"
3. Take screenshot showing the typed message

### Step 5: Send the Message

1. Look for a submit button (button[type="submit"])
2. Click the send button OR press Enter
3. Take screenshot immediately after sending

### Step 6: Wait for AI Response

1. Wait 10 seconds
2. Take screenshot of the chat after waiting

### Step 7: Verify Results

1. Check if your message ("Hello, what can you help me with?") appears in the chat
2. Check if an AI response appears
3. Count total messages visible

## Expected Results

- User message sent: YES
- AI response received: YES
- Total messages: At least 2 (user + AI)
- Test status: PASS

## Failure Cases

- If redirected to login from /chat: Authentication failed
- If no textarea found: Chat UI not rendering
- If message doesn't send: Send functionality broken
- If no AI response after 10 seconds: Backend/AI integration issue

## Screenshots to Take

1. chat-01-login-page.png
2. chat-02-after-oauth.png
3. chat-03-chat-page.png
4. chat-04-input-found.png
5. chat-05-message-typed.png
6. chat-06-message-sent.png
7. chat-07-ai-response.png

