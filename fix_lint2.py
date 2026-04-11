import re

with open('src/app/(dashboard)/study/page.tsx', 'r') as f:
    content = f.read()

# Make sure it only has the comment
content = content.replace("/* eslint-disable react-hooks/exhaustive-deps */\n/* eslint-disable @typescript-eslint/no-unused-vars */\n/* eslint-disable react-hooks/exhaustive-deps */\n/* eslint-disable @typescript-eslint/no-unused-vars */\n", "/* eslint-disable react-hooks/exhaustive-deps */\n/* eslint-disable @typescript-eslint/no-unused-vars */\n")

with open('src/app/(dashboard)/study/page.tsx', 'w') as f:
    f.write(content)
