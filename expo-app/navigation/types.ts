export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  NoticesTab: undefined;
  NetworkingTab: undefined;
  ChatTab: undefined;
  MoreTab: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string; otherUserName: string; otherUserId: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Organizations: undefined;
  HumanResources: undefined;
  PhysicalResources: undefined;
  Ideas: undefined;
  Talent: undefined;
  AIChat: undefined;
  Feedback: undefined;
  Search: undefined;
  Profile: undefined;
};
