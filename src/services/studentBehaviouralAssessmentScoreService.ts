import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode, parseDecimalNonNegative } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  student: {
    select: { id: true, admissionNumber: true, firstName: true, lastName: true, status: true },
  },
  behaviouralAssessmentComponent: {
    select: {
      id: true,
      name: true,
      maxScore: true,
      orderNo: true,
      behaviourTemplateId: true,
      behaviourTemplate: { select: { id: true, name: true, isLocked: true } },
    },
  },
} satisfies Prisma.StudentBehaviouralAssessmentScoreInclude;

type Row = Prisma.StudentBehaviouralAssessmentScoreGetPayload<{ include: typeof include }>;

export interface StudentBehaviouralAssessmentScoreData {
  id: string;
  studentId: string;
  student: Row["student"];
  behaviouralAssessmentComponentId: string;
  behaviouralAssessmentComponent: Row["behaviouralAssessmentComponent"];
  score: string;
}

function mapRow(row: Row): StudentBehaviouralAssessmentScoreData {
  return {
    id: row.id,
    studentId: row.studentId,
    student: row.student,
    behaviouralAssessmentComponentId: row.behaviouralAssessmentComponentId,
    behaviouralAssessmentComponent: row.behaviouralAssessmentComponent,
    score: row.score.toString(),
  };
}

export class StudentBehaviouralAssessmentScoreService {
  private prisma = prisma;

  private async assertRefs(input: {
    studentId: string;
    behaviouralAssessmentComponentId: string;
    score: Prisma.Decimal;
  }): Promise<void> {
    const [student, component] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
      this.prisma.behaviouralAssessmentComponent.findUnique({
        where: { id: input.behaviouralAssessmentComponentId },
        select: {
          id: true,
          maxScore: true,
          behaviourTemplate: { select: { isLocked: true } },
        },
      }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!component) throw new Error("Invalid behaviouralAssessmentComponentId");
    if (component.behaviourTemplate.isLocked) {
      throw new Error("Cannot record score: behavioural assessment template is locked");
    }
    if (input.score.gt(component.maxScore)) {
      throw new Error(`score cannot exceed component maxScore (${component.maxScore.toString()})`);
    }
  }

  private async assertScoreNotDuplicate(
    studentId: string,
    behaviouralAssessmentComponentId: string,
    excludeId?: string
  ): Promise<void> {
    const existing = await this.prisma.studentBehaviouralAssessmentScore.findFirst({
      where: {
        studentId,
        behaviouralAssessmentComponentId,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Student already has a score for this behavioural component");
    }
  }

  async create(input: {
    studentId: string;
    behaviouralAssessmentComponentId: string;
    score: string | number;
  }): Promise<StudentBehaviouralAssessmentScoreData> {
    const studentId = input.studentId.trim();
    const behaviouralAssessmentComponentId = input.behaviouralAssessmentComponentId.trim();
    if (!studentId) throw new Error("studentId is required");
    if (!behaviouralAssessmentComponentId) {
      throw new Error("behaviouralAssessmentComponentId is required");
    }

    const score = parseDecimalNonNegative(input.score, "score");
    await this.assertRefs({ studentId, behaviouralAssessmentComponentId, score });
    await this.assertScoreNotDuplicate(studentId, behaviouralAssessmentComponentId);

    const row = await this.prisma.studentBehaviouralAssessmentScore.create({
      data: { studentId, behaviouralAssessmentComponentId, score },
      include,
    });
    return mapRow(row);
  }

  async createMany(input: {
    behaviouralAssessmentComponentId: string;
    studentScores: { studentId: string; score: string | number }[];
  }): Promise<{ studentBehaviouralAssessmentScores: StudentBehaviouralAssessmentScoreData[]; count: number }> {
    const behaviouralAssessmentComponentId = input.behaviouralAssessmentComponentId.trim();
    if (!behaviouralAssessmentComponentId) {
      throw new Error("behaviouralAssessmentComponentId is required");
    }
    if (!Array.isArray(input.studentScores) || input.studentScores.length === 0) {
      throw new Error("studentScores must be a non-empty array");
    }

    const studentScores = input.studentScores.map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        throw new Error(`studentScores[${index}] must be an object`);
      }
      const studentId = entry.studentId;
      if (typeof studentId !== "string" || !studentId.trim()) {
        throw new Error(`studentScores[${index}].studentId must be a non-empty string`);
      }
      return {
        studentId: studentId.trim(),
        score: parseDecimalNonNegative(entry.score, `studentScores[${index}].score`),
      };
    });

    const studentIds = studentScores.map((entry) => entry.studentId);
    const duplicateIds = [...new Set(studentIds.filter((id, index) => studentIds.indexOf(id) !== index))];
    if (duplicateIds.length > 0) {
      throw new Error("Duplicate studentId in request");
    }

    const component = await this.prisma.behaviouralAssessmentComponent.findUnique({
      where: { id: behaviouralAssessmentComponentId },
      select: {
        id: true,
        maxScore: true,
        behaviourTemplate: { select: { isLocked: true } },
      },
    });
    if (!component) throw new Error("Invalid behaviouralAssessmentComponentId");
    if (component.behaviourTemplate.isLocked) {
      throw new Error("Cannot record score: behavioural assessment template is locked");
    }
    for (const entry of studentScores) {
      if (entry.score.gt(component.maxScore)) {
        throw new Error(`score cannot exceed component maxScore (${component.maxScore.toString()})`);
      }
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true },
    });
    if (students.length !== studentIds.length) throw new Error("Invalid studentId");

    const existing = await this.prisma.studentBehaviouralAssessmentScore.findMany({
      where: {
        behaviouralAssessmentComponentId,
        studentId: { in: studentIds },
      },
      select: { id: true, studentId: true },
    });
    const existingByStudent = new Map(existing.map((row) => [row.studentId, row.id]));

    const rows = await this.prisma.$transaction(
      studentScores.map((entry) => {
        const existingId = existingByStudent.get(entry.studentId);
        if (existingId) {
          return this.prisma.studentBehaviouralAssessmentScore.update({
            where: { id: existingId },
            data: { score: entry.score },
            include,
          });
        }
        return this.prisma.studentBehaviouralAssessmentScore.create({
          data: {
            studentId: entry.studentId,
            behaviouralAssessmentComponentId,
            score: entry.score,
          },
          include,
        });
      })
    );
    return { studentBehaviouralAssessmentScores: rows.map(mapRow), count: rows.length };
  }

  async list(params: {
    studentId?: string;
    behaviouralAssessmentComponentId?: string;
    behaviourTemplateId?: string;
  }) {
    const where: Prisma.StudentBehaviouralAssessmentScoreWhereInput = {};
    if (params.studentId?.trim()) where.studentId = params.studentId.trim();
    if (params.behaviouralAssessmentComponentId?.trim()) {
      where.behaviouralAssessmentComponentId = params.behaviouralAssessmentComponentId.trim();
    }
    if (params.behaviourTemplateId?.trim()) {
      where.behaviouralAssessmentComponent = {
        behaviourTemplateId: params.behaviourTemplateId.trim(),
      };
    }

    const rows = await this.prisma.studentBehaviouralAssessmentScore.findMany({
      where,
      include,
      orderBy: [{ studentId: "asc" }, { behaviouralAssessmentComponentId: "asc" }],
    });
    return { studentBehaviouralAssessmentScores: rows.map(mapRow), count: rows.length };
  }

  async getById(id: string): Promise<StudentBehaviouralAssessmentScoreData | null> {
    const row = await this.prisma.studentBehaviouralAssessmentScore.findUnique({ where: { id }, include });
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    input: { score?: string | number; behaviouralAssessmentComponentId?: string }
  ): Promise<StudentBehaviouralAssessmentScoreData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student behavioural assessment score not found");
    if (existing.behaviouralAssessmentComponent.behaviourTemplate.isLocked) {
      throw new Error("Cannot update score: behavioural assessment template is locked");
    }

    const behaviouralAssessmentComponentId =
      input.behaviouralAssessmentComponentId?.trim() ||
      existing.behaviouralAssessmentComponentId;
    const score =
      input.score !== undefined
        ? parseDecimalNonNegative(input.score, "score")
        : new Prisma.Decimal(existing.score);

    await this.assertRefs({
      studentId: existing.studentId,
      behaviouralAssessmentComponentId,
      score,
    });
    if (input.behaviouralAssessmentComponentId !== undefined) {
      await this.assertScoreNotDuplicate(existing.studentId, behaviouralAssessmentComponentId, id);
    }

    try {
      const row = await this.prisma.studentBehaviouralAssessmentScore.update({
        where: { id },
        data: {
          ...(input.score !== undefined ? { score } : {}),
          ...(input.behaviouralAssessmentComponentId !== undefined
            ? { behaviouralAssessmentComponentId }
            : {}),
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student behavioural assessment score not found");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<StudentBehaviouralAssessmentScoreData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student behavioural assessment score not found");
    if (existing.behaviouralAssessmentComponent.behaviourTemplate.isLocked) {
      throw new Error("Cannot delete score: behavioural assessment template is locked");
    }
    try {
      const row = await this.prisma.studentBehaviouralAssessmentScore.delete({ where: { id }, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student behavioural assessment score not found");
      }
      throw e;
    }
  }
}

export const studentBehaviouralAssessmentScoreService = new StudentBehaviouralAssessmentScoreService();
