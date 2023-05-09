import Head from 'next/head';
import styled from 'styled-components';
import Sidebar from '../../src/components/Sidebar';
import { GetServerSideProps } from 'next';
import { auth, db } from '../../src/config/firebase';
import { doc, getDoc, getDocs } from 'firebase/firestore';
import { Conversation, IMessage } from '../../src/types';
import { getRecipientEmail } from '../../src/utils/getRecipientEmail';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  generateQueryGetMessages,
  transformMessage,
} from '../../src/utils/getMessagesInConversation';
import ConversationScreen from '../../src/components/ConversationScreen';

export interface Props {
  conversation: Conversation;
  messages: IMessage[];
}

const StyledContainer = styled.div`
  display: flex;
`;
const StyledConversationContainer = styled.div`
  flex-grow: 1;
  overflow: scroll;
  height: 100vh;
  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
`;
const Conversations = ({ conversation, messages }: Props) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  return (
    <StyledContainer>
      <Head>
        <title>Conversation with {getRecipientEmail(conversation.users, loggedInUser)}</title>
      </Head>
      <Sidebar />
      <StyledConversationContainer>
        <ConversationScreen conversation={conversation} messages={messages} />
      </StyledConversationContainer>
    </StyledContainer>
  );
};

export default Conversations;

export const getServerSideProps: GetServerSideProps<Props, { id: string }> = async (context) => {
  const conversationId = context.params?.id;

  const conversationRef = doc(db, 'conversations', conversationId as string);
  const conversationSnapshot = await getDoc(conversationRef);

  const queryMessages = generateQueryGetMessages(conversationId);
  const messagesSnapshot = await getDocs(queryMessages);
  const messages = messagesSnapshot.docs.map((doc) => transformMessage(doc));

  return {
    props: {
      conversation: conversationSnapshot.data() as Conversation,
      messages,
    },
  };
};
