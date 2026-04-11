import re

with open('src/app/(dashboard)/study/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("mentorStore.startStreamingMentor", "useMentorStore.getState().startStreamingMentor")

with open('src/app/(dashboard)/study/page.tsx', 'w') as f:
    f.write(content)
