import re

with open('src/app/(dashboard)/study/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("const mentorStore = useMentorStore();", "const { triggerMentor } = useMentorStore();")
content = content.replace("mentorStore.finishStreaming()", "useMentorStore.getState().finishStreaming()")

with open('src/app/(dashboard)/study/page.tsx', 'w') as f:
    f.write(content)
