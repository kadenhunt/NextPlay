import type {
  FantasyTeam,
  League,
  LeagueMember,
  LeagueRole,
  LeagueState,
  TeamSummary,
} from "../types/leagues";
import type { DraftState, TeamState } from "../types/draft";
import type { ChatMessage } from "../types/chat";

type LeagueSeed = {
  id: string;
  name: string;
  sport: League["sport"];
  state: LeagueState;
  inviteCode: string;
  members: LeagueMember[];
  teams: FantasyTeam[];
  rosterCap: number;
  draftState: Omit<DraftState, "currentTeamName" | "isCurrentUserTurn">;
  chatMessages: ChatMessage[];
};

const now = new Date();
const upcomingLock = new Date(now.getTime() + 1000 * 60 * 60 * 12).toISOString();
const recentLock = new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString();

const message = (
  id: string,
  leagueId: string,
  userId: string,
  displayName: string,
  text: string,
  createdAt: string,
): ChatMessage => ({
  id,
  leagueId,
  userId,
  displayName,
  text,
  createdAt,
});

const team = (
  id: string,
  name: string,
  ownerUserId: string,
  lineupLockAt: string,
): FantasyTeam => ({
  id,
  name,
  ownerUserId,
  rosterPlayerIds: [],
  lineup: {
    starters: [],
    bench: [],
  },
  lineupLockAt,
});

const leagueSeeds: LeagueSeed[] = [
  {
    id: "1",
    name: "Saturday Lights: East Division",
    sport: "football",
    state: "CREATED",
    inviteCode: "PLAY123",
    members: [
      { userId: "user_1", role: "COMMISSIONER", displayName: "Kaden" },
      { userId: "user_2", role: "MEMBER", displayName: "Hudson" },
      { userId: "user_3", role: "MEMBER", displayName: "Ahmad" },
      { userId: "user_4", role: "MEMBER", displayName: "Fardeen" },
      { userId: "user_5", role: "MEMBER", displayName: "Maya" },
      { userId: "user_6", role: "MEMBER", displayName: "Khalil" },
    ],
    teams: [
      team("1_team_1", "Route Runners", "user_1", upcomingLock),
      team("1_team_2", "Iron Valley", "user_2", upcomingLock),
      team("1_team_3", "Fourth & Gold", "user_3", upcomingLock),
      team("1_team_4", "Northside Blitz", "user_4", upcomingLock),
      team("1_team_5", "Red Zone Unit", "user_5", upcomingLock),
      team("1_team_6", "Gridline Kings", "user_6", upcomingLock),
    ],
    rosterCap: 10,
    draftState: {
      leagueId: "1",
      status: "DRAFT_SCHEDULED",
      draftType: "snake",
      currentOverallPick: 1,
      currentRound: 1,
      currentPickInRound: 1,
      currentTeamId: "1_team_1",
      autoDraftTeamIds: [],
      timerEndsAt: upcomingLock,
      picks: [],
    },
    chatMessages: [
      message(
        "chat_1_1",
        "1",
        "user_1",
        "Kaden",
        "Welcome to the league. Draft scheduling is almost ready.",
        new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      ),
      message(
        "chat_1_2",
        "1",
        "user_2",
        "Hudson",
        "I’m good with a Saturday draft if everyone is free.",
        new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
      ),
    ],
  },
  {
    id: "2",
    name: "Prime Time Gridiron",
    sport: "football",
    state: "SEASON_ACTIVE",
    inviteCode: "GRID789",
    members: [
      { userId: "user_1", role: "COMMISSIONER", displayName: "Kaden" },
      { userId: "user_2", role: "MEMBER", displayName: "Hudson" },
      { userId: "user_3", role: "MEMBER", displayName: "Ahmad" },
      { userId: "user_4", role: "MEMBER", displayName: "Fardeen" },
      { userId: "user_5", role: "MEMBER", displayName: "Maya" },
      { userId: "user_6", role: "MEMBER", displayName: "Khalil" },
      { userId: "user_7", role: "MEMBER", displayName: "Jace" },
      { userId: "user_8", role: "MEMBER", displayName: "Riley" },
    ],
    teams: [
      team("2_team_1", "Prime Blitz", "user_1", recentLock),
      team("2_team_2", "Goal Line Crew", "user_2", recentLock),
      team("2_team_3", "Deep Route Co.", "user_3", recentLock),
      team("2_team_4", "Pocket Pressure", "user_4", recentLock),
      team("2_team_5", "Red Zone Bandits", "user_5", recentLock),
      team("2_team_6", "Huddle Unit", "user_6", recentLock),
      team("2_team_7", "End Zone Syndicate", "user_7", recentLock),
      team("2_team_8", "Two Minute Drive", "user_8", recentLock),
    ],
    rosterCap: 10,
    draftState: {
      leagueId: "2",
      status: "COMPLETE",
      draftType: "snake",
      currentOverallPick: 25,
      currentRound: 5,
      currentPickInRound: 1,
      currentTeamId: "2_team_1",
      autoDraftTeamIds: [],
      timerEndsAt: recentLock,
      picks: [],
    },
    chatMessages: [
      message(
        "chat_2_1",
        "2",
        "user_2",
        "Hudson",
        "Nice start this week. Bullpen streamers paid off.",
        new Date(now.getTime() - 1000 * 60 * 70).toISOString(),
      ),
      message(
        "chat_2_2",
        "2",
        "user_1",
        "Kaden",
        "Need one more bat before the weekend series.",
        new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
      ),
    ],
  },
];

const getMemberRole = (members: LeagueMember[], userId: string): LeagueRole | null =>
  members.find((member) => member.userId === userId)?.role ?? null;

const getMember = (members: LeagueMember[], userId: string): LeagueMember | null =>
  members.find((member) => member.userId === userId) ?? null;

export const leagueStore = {
  listLeaguesForUser(userId: string): League[] {
    return leagueSeeds
      .map((league) => {
        const role = getMemberRole(league.members, userId);
        if (!role) {
          return null;
        }

        return {
          id: league.id,
          name: league.name,
          sport: league.sport,
          state: league.state,
          inviteCode: league.inviteCode,
          members: league.members,
          role,
        };
      })
      .filter((league): league is League => league !== null);
  },

  getLeagueForUser(leagueId: string, userId: string): League | null {
    const league = leagueSeeds.find((entry) => entry.id === leagueId);
    if (!league) {
      return null;
    }

    const role = getMemberRole(league.members, userId);
    if (!role) {
      return null;
    }

    return {
      id: league.id,
      name: league.name,
      sport: league.sport,
      state: league.state,
      inviteCode: league.inviteCode,
      members: league.members,
      role,
    };
  },

  userHasLeagueAccess(leagueId: string, userId: string): boolean {
    return this.getLeagueForUser(leagueId, userId) !== null;
  },

  listTeamsForUser(userId: string, leagueId?: string): TeamSummary[] {
    return leagueSeeds.flatMap((league) => {
      if (leagueId && league.id !== leagueId) {
        return [];
      }

      if (!getMemberRole(league.members, userId)) {
        return [];
      }

      return league.teams.map((entry) => ({
        ...entry,
        leagueId: league.id,
      }));
    });
  },

  getTeamForUser(teamId: string, userId: string): TeamSummary | null {
    for (const league of leagueSeeds) {
      if (!getMemberRole(league.members, userId)) {
        continue;
      }

      const foundTeam = league.teams.find((entry) => entry.id === teamId);
      if (foundTeam) {
        return {
          ...foundTeam,
          leagueId: league.id,
        };
      }
    }

    return null;
  },

  getDraftStateForUser(leagueId: string, userId: string): DraftState | null {
    const league = leagueSeeds.find((entry) => entry.id === leagueId);
    if (!league || !getMemberRole(league.members, userId)) {
      return null;
    }

    const currentTeam = league.teams.find((entry) => entry.id === league.draftState.currentTeamId);
    if (!currentTeam) {
      return null;
    }

    return {
      ...league.draftState,
      currentTeamName: currentTeam.name,
      isCurrentUserTurn:
        league.draftState.status === "DRAFT_IN_PROGRESS" &&
        currentTeam.ownerUserId === userId,
    };
  },

  getMyTeamStateForUser(leagueId: string, userId: string): TeamState | null {
    const league = leagueSeeds.find((entry) => entry.id === leagueId);
    if (!league || !getMemberRole(league.members, userId)) {
      return null;
    }

    const team = league.teams.find((entry) => entry.ownerUserId === userId);
    if (!team) {
      return null;
    }

    return {
      leagueId: league.id,
      team,
      isLineupLocked: new Date(team.lineupLockAt).getTime() <= Date.now(),
      rosterCap: league.rosterCap,
    };
  },

  listChatMessagesForUser(leagueId: string, userId: string): ChatMessage[] | null {
    const league = leagueSeeds.find((entry) => entry.id === leagueId);
    if (!league || !getMemberRole(league.members, userId)) {
      return null;
    }

    return league.chatMessages
      .slice()
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  },

  postChatMessageForUser(leagueId: string, userId: string, text: string): ChatMessage[] | null {
    const league = leagueSeeds.find((entry) => entry.id === leagueId);
    if (!league) {
      return null;
    }

    const member = getMember(league.members, userId);
    if (!member) {
      return null;
    }

    const nextMessage: ChatMessage = {
      id: `chat_${leagueId}_${Date.now()}`,
      leagueId,
      userId,
      displayName: member.displayName,
      text,
      createdAt: new Date().toISOString(),
    };

    league.chatMessages.push(nextMessage);

    return league.chatMessages
      .slice()
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  },
};
