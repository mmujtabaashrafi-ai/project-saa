const fetch = globalThis.fetch;

async function runTests() {
  console.log('\n=============================================');
  console.log('🧪 Saba’s World Comprehensive Verification Suite');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  // 1. Health Check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  assert('Server Health Check', healthData.status === 'ok');

  // 2. Saba Login
  const sabaLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'saba', password: 'saba.26' }),
  });
  const sabaData = await sabaLogin.json();
  assert('Saba Login (200 OK & success=true)', sabaData.success === true && !!sabaData.token);
  assert('Saba Display Name', sabaData.user?.displayName === 'Saba');

  // 3. Admin Login
  const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mohammed.mujtaba', password: 'MUJTABA.26' }),
  });
  const adminData = await adminLogin.json();
  assert('Admin Login', adminData.success === true && adminData.user?.role === 'admin');

  // 4. Invalid Password Handling (Proper 401 JSON without crash)
  const invalidLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'saba', password: 'wrongpassword' }),
  });
  const invalidData = await invalidLogin.json();
  assert('Invalid credentials returns 401 gracefully', invalidLogin.status === 401 && invalidData.success === false);

  // 5. Auth Token Verification
  const token = sabaData.token;
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  assert('Token /auth/me authentication', meData.success === true && meData.user?.username === 'saba');

  // 6. "Who is Saba?" Dedicated Response Check
  const whoIsSabaRes = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Who is Saba?' }),
  });
  const whoIsSabaData = await whoIsSabaRes.json();
  assert('Who is Saba? API call success', whoIsSabaData.success === true);
  const whoIsSabaText = whoIsSabaData.response || whoIsSabaData.assistantMessage?.content || '';
  assert(
    'Who is Saba? returns respectful style description (modesty, grace, hijab, dignity)',
    whoIsSabaText.toLowerCase().includes('grace') &&
    whoIsSabaText.toLowerCase().includes('modesty') &&
    whoIsSabaText.toLowerCase().includes('hijab')
  );

  // 7. Saba Quote Query Check
  const quoteRes = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Give me a quote about Saba' }),
  });
  const quoteData = await quoteRes.json();
  assert('Saba Quote API status', quoteData.success === true);
  const quoteText = quoteData.response || quoteData.assistantMessage?.content || '';
  assert('Saba Quote returns non-empty reflection', typeof quoteText === 'string' && quoteText.length > 20);

  // 8. General / Technical AI Chatbot API - Non-null response guarantee
  const aiChatRes = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Explain Object Oriented Programming in Java' }),
  });
  const aiChatData = await aiChatRes.json();
  assert('AI Chat API status', aiChatData.success === true);
  assert('AI Chat response is non-null string', typeof aiChatData.response === 'string' && aiChatData.response.length > 50);
  assert('AI Assistant Message is non-null', typeof aiChatData.assistantMessage?.content === 'string' && aiChatData.assistantMessage.content.length > 50);

  // 9. React Boat Chatbot API - Non-null response guarantee
  const rbChatRes = await fetch('http://localhost:5000/api/react-boat/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'What are the main principles of clean software architecture?' }),
  });
  const rbChatData = await rbChatRes.json();
  assert('ReactBoat Chat API status', rbChatData.success === true);
  assert('ReactBoat Chat response is non-null string', typeof rbChatData.response === 'string' && rbChatData.response.length > 50);

  // 10. Verify No Fake Accounts in Users List
  const usersRes = await fetch('http://localhost:5000/api/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const usersData = await usersRes.json();
  const fakeUsers = (usersData.users || []).filter((u) => /^user\d+$/i.test(u.username));
  assert('Fake dummy users removed (user03..user22 count = 0)', fakeUsers.length === 0, `Found: ${fakeUsers.length}`);

  // 11. AI Conversations List
  const convsRes = await fetch('http://localhost:5000/api/ai/conversations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const convsData = await convsRes.json();
  assert('AI Conversations retrieval', convsData.success === true && Array.isArray(convsData.conversations));

  // 12. AI Knowledge Retrieval
  const knowRes = await fetch('http://localhost:5000/api/ai/knowledge', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const knowData = await knowRes.json();
  assert('AI Knowledge Base populated', knowData.success === true && knowData.knowledge.length > 0);

  console.log('\n---------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('---------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test suite exception:', err);
  process.exit(1);
});
