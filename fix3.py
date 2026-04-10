import re

with open('src/app/(dashboard)/study/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("const mentorStore = useMentorStore.getState();\n", "")

with open('src/app/(dashboard)/study/page.tsx', 'w') as f:
    f.write(content)
