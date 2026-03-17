-- Enable Vector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Table pi_projects
CREATE TABLE IF NOT EXISTS pi_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    problem_solved TEXT,
    mvp_definition TEXT,
    status TEXT CHECK (status IN ('Idea', 'Definiendo', 'En Desarrollo', 'Bloqueado', 'Lanzado', 'Archivado')) DEFAULT 'Idea',
    deadline TIMESTAMP WITH TIME ZONE,
    personal_commitment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pi_tasks
CREATE TABLE IF NOT EXISTS pi_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES pi_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pi_idea_brainstorm
CREATE TABLE IF NOT EXISTS pi_idea_brainstorm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_idea TEXT NOT NULL,
    context TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (Row Level Security) - Simplified for MVP
ALTER TABLE pi_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_idea_brainstorm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anonymous" ON pi_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous" ON pi_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous" ON pi_idea_brainstorm FOR ALL USING (true) WITH CHECK (true);
