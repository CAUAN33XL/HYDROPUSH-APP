export interface UserStats {
    totalDaysTracked: number;
    currentStreak: number;
    bestStreak: number;
    totalWaterConsumed: number;
    perfectDays: number;
    monthlyGoalsAchieved: number;
    totalGoalsAchieved: number;
    averageCompletion: number;
    lastUpdated: string;
    
    // Penalidades
    totalPenaltyXp: number;
    lastPenaltyEvaluationDate?: string;
}
