async function login() {
  try {
    const res = await fetch('https://www.myenvisionltd.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'Saj@myenvisionltd.com',
        password: 'qmZU^xf00v^b8hxP'
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

login();
