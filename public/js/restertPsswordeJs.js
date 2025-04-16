
    function generatePassword() {
    const username = document.getElementById('username').value;

    // בדיקת אם שם המשתמש לא הוזן
    if (!username.trim()) {
    document.getElementById('password').innerText = "נא להכניס שם משתמש!";
    return;
}

    const length = 10; // אורך הסיסמה שנקבע מראש
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/"; // תוויה שיכולות להיכלל בסיסמה

    let password = "";
    for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
}

    document.getElementById('password').innerText = password;
}
