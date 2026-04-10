const fs = require('fs');

async function test() {
    const formData = new FormData();
    formData.append('text', 'Mathematics: Calculus, Algebra. Physics: Mechanics.');

    try {
        const res = await fetch('http://localhost:3000/api/syllabus/parse', {
            method: 'POST',
            body: formData
        });
        console.log("Status:", res.status);
        const data = await res.text();
        fs.writeFileSync('test-out.json', data);
        console.log("Wrote to test-out.json. Valid JSON:", (() => { try { JSON.parse(data); return true; } catch (e) { return false; } })());
    } catch (e) {
        console.error(e);
    }
}
test();
