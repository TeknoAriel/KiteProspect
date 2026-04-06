-- Matriz oficial: etapa y rama en secuencia activa; intensidad de plan con default normal.
ALTER TABLE "FollowUpPlan" ALTER COLUMN "intensity" SET DEFAULT 'normal';

ALTER TABLE "FollowUpSequence" ADD COLUMN "matrixCoreStageKey" TEXT;
ALTER TABLE "FollowUpSequence" ADD COLUMN "matrixBranchKey" TEXT;
