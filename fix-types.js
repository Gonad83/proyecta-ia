import fs from 'fs';

const replaces = [
  { p: 'src/hooks/useProjects.ts', from: "import { Project } from '../types';", to: "import type { Project } from '../types';" },
  { p: 'src/hooks/useTasks.ts', from: "import { Task, PRIORITY } from '../types';", to: "import type { Task } from '../types';\nimport { PRIORITY } from '../types';" },
  { p: 'src/hooks/useIdeas.ts', from: "import { Idea } from '../types';", to: "import type { Idea } from '../types';" },
  { p: 'src/components/forms/CreateProjectForm.tsx', from: "import { Project } from '../../types';", to: "import type { Project } from '../../types';" },
  { p: 'src/components/views/ExecutionView.tsx', from: "import { Project, PRIORITY } from '../../types';", to: "import type { Project } from '../../types';\nimport { PRIORITY } from '../../types';" },
  { p: 'src/components/views/ProjectsView.tsx', from: "import { Project } from '../../types';", to: "import type { Project } from '../../types';" },
  { p: 'src/App.tsx', from: "import { View } from './types';", to: "import type { View } from './types';" },
  { p: 'src/components/ui/Navbar.tsx', from: "import { View } from '../../types';", to: "import type { View } from '../../types';" },
  { p: 'src/components/ui/TaskItem.tsx', from: "import { Task, PRIORITY } from '../../types';", to: "import type { Task } from '../../types';\nimport { PRIORITY } from '../../types';" }
];

replaces.forEach(item => {
  let content = fs.readFileSync(item.p, 'utf-8');
  content = content.replace(item.from, item.to);
  fs.writeFileSync(item.p, content);
});
console.log("Fixed types");
