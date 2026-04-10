/**
 * EXAMER Agent Architecture — Integration Test Script
 * 
 * Run with: node test-agent.js
 * 
 * Tests all 3 API endpoints:
 *   1. POST /api/agent/session   — Create session
 *   2. POST /api/agent/tools     — Direct tool invocation
 *   3. POST /api/agent/chat      — Streaming chat
 *   4. GET  /api/agent/session    — Check session status
 *   5. DELETE /api/agent/session  — End session
 *   6. GET  /api/agent/tools      — List available tools
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test_user_001';
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

let sessionId = null;

async function log(label, data) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${label}`);
    console.log('='.repeat(60));
    if (typeof data === 'object') {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log(data);
    }
}

function buildHeaders(extraHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
        ...extraHeaders,
    };

    if (TEST_AUTH_TOKEN) {
        headers.Authorization = `Bearer ${TEST_AUTH_TOKEN}`;
    }

    return headers;
}

async function testCreateSession() {
    log('TEST 1: Create Session', 'POST /api/agent/session');

    const res = await fetch(`${BASE_URL}/api/agent/session`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
            userId: TEST_USER_ID,
            context: {
                currentTopic: 'Data Structures',
                currentSubject: 'Computer Science',
                timeSpent: '15 minutes',
                recentErrors: 2,
                streak: 5,
                predictedScore: 180,
                targetScore: 250,
                daysToExam: 120,
                weaknesses: ['Dynamic Programming', 'Graph Theory'],
                prepLevel: 'intermediate',
                favoriteSubject: 'Computer Science',
                importantMemories: ['Student struggles with recursion'],
            },
        }),
    });

    const data = await res.json();
    sessionId = data.sessionId;
    log('Session Created', data);
    return data.success;
}

async function testListTools() {
    log('TEST 2: List Available Tools', 'GET /api/agent/tools');

    const res = await fetch(`${BASE_URL}/api/agent/tools`);
    const data = await res.json();
    log('Available Tools', data);
    return data.count > 0;
}

async function testToolCall() {
    log('TEST 3: Direct Tool Call — generate_mcq', 'POST /api/agent/tools');

    const res = await fetch(`${BASE_URL}/api/agent/tools`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
            tool: 'generate_mcq',
            params: {
                topic: 'Binary Search Trees',
                difficulty: 3,
                count: 2,
                subject: 'Computer Science',
            },
            userId: TEST_USER_ID,
            sessionId,
        }),
    });

    const data = await res.json();
    log('MCQ Generation Result', data);
    return data.success;
}

async function testFetchSyllabus() {
    log('TEST 4: Direct Tool Call — fetch_syllabus_topic', 'POST /api/agent/tools');

    const res = await fetch(`${BASE_URL}/api/agent/tools`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
            tool: 'fetch_syllabus_topic',
            params: {
                subject: 'computer_science',
                topic_name: 'Data Structures',
            },
            userId: TEST_USER_ID,
        }),
    });

    const data = await res.json();
    log('Syllabus Fetch Result', data);
    return data.success;
}

async function testStreamingChat() {
    log('TEST 5: Streaming Chat', 'POST /api/agent/chat');

    const res = await fetch(`${BASE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
            sessionId,
            userId: TEST_USER_ID,
            message: 'I\'m struggling with Binary Search Trees. Can you help me understand the insertion algorithm? Also quiz me on it.',
            context: {
                currentTopic: 'Binary Search Trees',
                currentSubject: 'Computer Science',
                timeSpent: '20 minutes',
                recentErrors: 3,
                streak: 5,
                predictedScore: 180,
                targetScore: 250,
                daysToExam: 120,
                weaknesses: ['Tree Traversals', 'BST Operations'],
                prepLevel: 'intermediate',
                favoriteSubject: 'Computer Science',
                importantMemories: [],
            },
        }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('\n--- Streaming Response ---');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
            const jsonStr = line.replace('data: ', '');
            try {
                const parsed = JSON.parse(jsonStr);

                if (parsed.type === 'text') {
                    process.stdout.write(parsed.text);
                    fullResponse += parsed.text;
                } else if (parsed.type === 'tool_call') {
                    console.log(`\n[🔧 Tool Call: ${parsed.tool}(${JSON.stringify(parsed.args)})]`);
                } else if (parsed.type === 'tool_result') {
                    console.log(`\n[✅ Tool Result: ${parsed.tool} — ${parsed.success ? 'success' : 'failed'}]`);
                } else if (parsed.type === 'done') {
                    console.log('\n\n--- Stream Complete ---');
                } else if (parsed.type === 'error') {
                    console.error(`\n[❌ Error: ${parsed.error}]`);
                }
            } catch {
                // Skip non-JSON lines
            }
        }
    }

    return fullResponse.length > 0;
}

async function testSessionStatus() {
    log('TEST 6: Check Session Status', `GET /api/agent/session?sessionId=${sessionId}&userId=${TEST_USER_ID}`);

    const res = await fetch(`${BASE_URL}/api/agent/session?sessionId=${sessionId}&userId=${TEST_USER_ID}`, {
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
    });
    const data = await res.json();
    log('Session Status', data);
    return data.active;
}

async function testEndSession() {
    log('TEST 7: End Session', 'DELETE /api/agent/session');

    const res = await fetch(`${BASE_URL}/api/agent/session`, {
        method: 'DELETE',
        headers: buildHeaders(),
        body: JSON.stringify({
            sessionId,
            userId: TEST_USER_ID,
            context: {
                currentTopic: 'Binary Search Trees',
                currentSubject: 'Computer Science',
                predictedScore: 185,
                targetScore: 250,
                daysToExam: 120,
            },
        }),
    });

    const data = await res.json();
    log('Session Ended', data);
    return data.success;
}

// ---- Run all tests ----
async function runTests() {
    console.log('\n🚀 EXAMER Agent Architecture — Integration Tests');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Test User: ${TEST_USER_ID}`);
    console.log(`   Time: ${new Date().toISOString()}\n`);

    const results = [];

    try {
        results.push({ test: 'Create Session', pass: await testCreateSession() });
        results.push({ test: 'List Tools', pass: await testListTools() });
        results.push({ test: 'Generate MCQ (Tool)', pass: await testToolCall() });
        results.push({ test: 'Fetch Syllabus (Tool)', pass: await testFetchSyllabus() });
        results.push({ test: 'Streaming Chat', pass: await testStreamingChat() });
        results.push({ test: 'Session Status', pass: await testSessionStatus() });
        results.push({ test: 'End Session', pass: await testEndSession() });
    } catch (error) {
        console.error('\n❌ Test runner error:', error.message);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('  TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    for (const r of results) {
        console.log(`  ${r.pass ? '✅' : '❌'} ${r.test}`);
    }
    const passed = results.filter(r => r.pass).length;
    console.log(`\n  ${passed}/${results.length} tests passed\n`);
}

runTests().catch(console.error);
