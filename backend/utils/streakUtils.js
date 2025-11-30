const startOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const calculateStreak = (user, activityDate = new Date()) => {
  const today = startOfDay(new Date());
  const activityDay = startOfDay(activityDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newCurrentStreak = 0;
  let newLongestStreak = user.longestStreak || 0;

  if (!user.lastQuizDate) {
    newCurrentStreak = 1;
    newLongestStreak = Math.max(newLongestStreak, 1);
  } else {
    const lastQuizDay = startOfDay(user.lastQuizDate);

    if (activityDay.getTime() === today.getTime()) {
      if (lastQuizDay.getTime() === today.getTime()) {
        newCurrentStreak = user.currentStreak || 0;
      } else if (lastQuizDay.getTime() === yesterday.getTime()) {
        newCurrentStreak = (user.currentStreak || 0) + 1;
      } else if (lastQuizDay.getTime() < yesterday.getTime()) {
        newCurrentStreak = 1;
      } else {
        newCurrentStreak = user.currentStreak || 0;
      }
    } else {
      newCurrentStreak = user.currentStreak || 0;
    }
  }

  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }

  return { newCurrentStreak, newLongestStreak };
};

const updateStreakHistory = (user, streakCount, activityDate = new Date(), increment = 1) => {
  const day = startOfDay(activityDate);
  const existingHistoryEntry = user.streakHistory.find((entry) => {
    const entryDate = startOfDay(entry.date);
    return entryDate.getTime() === day.getTime();
  });

  if (existingHistoryEntry) {
    existingHistoryEntry.streakCount = streakCount;
    existingHistoryEntry.quizzesCompleted = (existingHistoryEntry.quizzesCompleted || 0) + increment;
  } else {
    user.streakHistory.push({
      date: day,
      streakCount,
      quizzesCompleted: increment
    });
  }
};

export const applyStreakProgress = (user, activityDate = new Date(), increment = 1) => {
  const { newCurrentStreak, newLongestStreak } = calculateStreak(user, activityDate);
  user.currentStreak = newCurrentStreak;
  user.longestStreak = newLongestStreak;
  user.lastQuizDate = activityDate;
  updateStreakHistory(user, newCurrentStreak, activityDate, increment);

  return {
    current: newCurrentStreak,
    longest: newLongestStreak
  };
};

export default {
  calculateStreak,
  applyStreakProgress
};

