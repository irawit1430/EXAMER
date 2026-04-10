import re

with open('src/app/(dashboard)/study/page.tsx', 'r') as f:
    content = f.read()

# Replace the incorrect replacement I just made
content = content.replace(
    'const { startQuestion, recordAnswer, questionsAttempted, correctCount, avgSecondsPerQuestion } = useMetricsStore();',
    'const { startQuestion, recordAnswer } = useMetricsStore();'
)

with open('src/app/(dashboard)/study/page.tsx', 'w') as f:
    f.write(content)
