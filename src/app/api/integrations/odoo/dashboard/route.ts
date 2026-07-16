import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { authenticateOdoo, executeKw } from '@/lib/odooXmlRpc';

type OdooMany2One = [number, string];

type OdooStage = {
  id: number;
  name: string;
  sequence: number;
};

type OdooProject = {
  id: number;
  name: string;
  stage_id: false | OdooMany2One;
  user_id: false | OdooMany2One;
};

type OdooTaskGroup = {
  project_id?: false | OdooMany2One;
  project_id_count: number;
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { database, password, uid } = await authenticateOdoo();
    const [stages, projects, taskGroups] = await Promise.all([
      executeKw<OdooStage[]>(database, uid, password, 'project.project.stage', 'search_read', [[]], {
        fields: ['id', 'name', 'sequence'],
        order: 'sequence asc',
      }),
      executeKw<OdooProject[]>(database, uid, password, 'project.project', 'search_read', [[]], {
        fields: ['id', 'name', 'stage_id', 'user_id'],
        order: 'name asc',
        limit: 500,
      }),
      executeKw<OdooTaskGroup[]>(database, uid, password, 'project.task', 'read_group', [[], ['project_id'], ['project_id']], {}),
    ]);

    const taskCountByProject = new Map<number, number>(
      taskGroups
        .filter((group) => Array.isArray(group.project_id))
        .map((group) => [(group.project_id as OdooMany2One)[0], group.project_id_count])
    );

    const byStage = stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      projects: projects.filter((project) => Array.isArray(project.stage_id) && project.stage_id[0] === stage.id).length,
      tasks: projects
        .filter((project) => Array.isArray(project.stage_id) && project.stage_id[0] === stage.id)
        .reduce((total, project) => total + (taskCountByProject.get(project.id) ?? 0), 0),
    }));

    const assigneeMap = new Map<number | string, { id: number | string; name: string; projects: number; tasks: number }>();
    for (const project of projects) {
      const ownerId = Array.isArray(project.user_id) ? project.user_id[0] : 'unassigned';
      const ownerName = Array.isArray(project.user_id) ? project.user_id[1] : 'Unassigned';
      const current = assigneeMap.get(ownerId) ?? { id: ownerId, name: ownerName, projects: 0, tasks: 0 };
      current.projects += 1;
      current.tasks += taskCountByProject.get(project.id) ?? 0;
      assigneeMap.set(ownerId, current);
    }

    const topProjects = projects
      .map((project) => ({
        id: project.id,
        name: project.name,
        stageName: Array.isArray(project.stage_id) ? project.stage_id[1] : 'Tanpa Stage',
        ownerName: Array.isArray(project.user_id) ? project.user_id[1] : 'Unassigned',
        tasks: taskCountByProject.get(project.id) ?? 0,
      }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 10);

    const inProgress = byStage.find((stage) => stage.name.toLowerCase().includes('progress'))?.projects ?? 0;
    const done = byStage.find((stage) => ['done', 'completed', 'complete'].includes(stage.name.toLowerCase()))?.projects ?? 0;
    const totalTasks = taskGroups.reduce((total, group) => total + group.project_id_count, 0);

    return NextResponse.json({
      summary: {
        totalProjects: projects.length,
        inProgress,
        done,
        totalTasks,
      },
      byStage,
      topAssignees: Array.from(assigneeMap.values())
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 10),
      topProjects,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal memuat dashboard Odoo.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
