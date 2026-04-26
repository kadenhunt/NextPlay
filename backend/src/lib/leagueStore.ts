import type {
  FantasyTeam,
  League,
  LeagueMember,
  LeagueRole,
  LeagueState,
  TeamSummary,
} from "../types/leagues";

type LeagueSeed = {
  id: string;
  name: string;
  sport: League["sport"];
  state: LeagueState;
  inviteCode: string;
  members: LeagueMember[];
  teams: FantasyTeam[];
};

const now = new Date();
const upcomingLock = new Date(now.getTime() + 1000 * 60 * 60 * 12).toISOString();
const recentLock = new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString();

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
  },
  {
    id: "2",
    name: "Hardwood Pulse League",
    sport: "basketball",
    state: "DRAFT_IN_PROGRESS",
    inviteCode: "SEASON456",
    members: [
      { userId: "user_1", role: "MEMBER", displayName: "Kaden" },
      { userId: "user_2", role: "COMMISSIONER", displayName: "Hudson" },
      { userId: "user_3", role: "MEMBER", displayName: "Ahmad" },
      { userId: "user_4", role: "MEMBER", displayName: "Fardeen" },
      { userId: "user_5", role: "MEMBER", displayName: "Maya" },
      { userId: "user_6", role: "MEMBER", displayName: "Khalil" },
      { userId: "user_7", role: "MEMBER", displayName: "Jace" },
      { userId: "user_8", role: "MEMBER", displayName: "Riley" },
    ],
    teams: [
      team("2_team_1", "Paint Pressure", "user_1", upcomingLock),
      team("2_team_2", "Full Court Flux", "user_2", upcomingLock),
      team("2_team_3", "Blue Arc", "user_3", upcomingLock),
      team("2_team_4", "Glass Cutters", "user_4", upcomingLock),
      team("2_team_5", "Tempo North", "user_5", upcomingLock),
      team("2_team_6", "Rim Theory", "user_6", upcomingLock),
      team("2_team_7", "Motion Unit", "user_7", upcomingLock),
      team("2_team_8", "Baseline Eight", "user_8", upcomingLock),
    ],
  },
  {
    id: "3",
    name: "Diamond Series Collective",
    sport: "baseball",
    state: "SEASON_ACTIVE",
    inviteCode: "CLUB789",
    members: [
      { userId: "user_1", role: "MEMBER", displayName: "Kaden" },
      { userId: "user_2", role: "COMMISSIONER", displayName: "Hudson" },
      { userId: "user_3", role: "MEMBER", displayName: "Ahmad" },
      { userId: "user_4", role: "MEMBER", displayName: "Fardeen" },
      { userId: "user_5", role: "MEMBER", displayName: "Maya" },
      { userId: "user_6", role: "MEMBER", displayName: "Khalil" },
    ],
    teams: [
      team("3_team_1", "Diamond Shift", "user_1", recentLock),
      team("3_team_2", "Bullpen Labs", "user_2", recentLock),
      team("3_team_3", "Left Field Noise", "user_3", recentLock),
      team("3_team_4", "Line Drive Club", "user_4", recentLock),
      team("3_team_5", "Southpaw Signals", "user_5", recentLock),
      team("3_team_6", "Night Game Nine", "user_6", recentLock),
    ],
  },
];

const getMemberRole = (members: LeagueMember[], userId: string): LeagueRole | null =>
  members.find((member) => member.userId === userId)?.role ?? null;

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
};

