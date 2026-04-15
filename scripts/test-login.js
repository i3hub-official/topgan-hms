import 'dotenv/config';

async function test() {
  const res = await fetch('http://localhost:5173/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@topgan.com', password: 'admin123' })
  });
  const data = await res.json();
  console.log(data);
}
test();