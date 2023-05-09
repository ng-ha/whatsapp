import styled from 'styled-components';
import { Props } from '../../pages/conversations/[id]';
import { useRecipient } from '../hooks/useRecipient';
import RecipientAvatar from './RecipientAvatar';
import {
  convertFirestoreTimestampToString,
  generateQueryGetMessages,
  transformMessage,
} from '../utils/getMessagesInConversation';
import { IconButton } from '@mui/material';
import { AttachFile, InsertEmoticon, Mic, MoreVert, Send } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../config/firebase';
import Message from './Message';
import { KeyboardEventHandler, useState, useRef, MouseEventHandler } from 'react';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

const StyledRecipientHeader = styled.div`
  position: sticky;
  background-color: white;
  z-index: 100;
  top: 0;
  display: flex;
  align-items: center;
  padding: 11px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
`;

const StyledHeaderInfo = styled.div`
  flex-grow: 1;
  > h3 {
    margin-top: 0;
    margin-bottom: 3px;
  }
  > span {
    font-size: 14px;
    color: gray;
  }
`;

const StyleH3 = styled.h3`
  word-break: break-all;
`;

const StyledHeaderIcons = styled.div`
  display: flex;
`;

const StyledMessageContainer = styled.div`
  padding: 30px;
  background-color: #e5ded8;
  min-height: 90vh;
`;
const StyledInputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 10px;
  position: sticky;
  bottom: 0;
  background-color: white;
  z-index: 100;
`;
const StyledInput = styled.input`
  flex-grow: 1;
  outline: none;
  border: none;
  border-radius: 10px;
  background-color: whitesmoke;
  padding: 15px;
  margin-left: 15px;
  margin-right: 15px;
`;
const EndOfMessagesForAutoScroll = styled.div`
  margin-bottom: 30px;
`;

const ConversationScreen = ({ conversation, messages }: Props) => {
  const [newMessage, setNewMessage] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const { recipient, recipientEmail } = useRecipient(conversation.users);
  const router = useRouter();
  const query = generateQueryGetMessages(router.query.id as string);
  const [messagesSnapshot, messagesLoading, __error] = useCollection(query);

  const showMessages = () => {
    // if Frontend is loading messages behind the scenes, display messages retrieved from Next SSR (passed down from [id].tsx)
    if (messagesLoading) {
      // return messages.map((message) => <p key={message.id}>{JSON.stringify(message)}</p>);
      return messages.map((message) => <Message key={message.id} message={message} />);
    }
    // if front-end has finished loading messages, now we have messagesSnapshot
    if (messagesSnapshot) {
      return messagesSnapshot.docs.map((message) => (
        <Message key={message.id} message={transformMessage(message)} />
      ));
    }
    return null;
  };
  const addMessageToDbAndUpdateLastSeen = async () => {
    await setDoc(
      doc(db, 'users', loggedInUser?.email as string),
      { lastSeen: serverTimestamp() },
      { merge: true }
    );
    await addDoc(collection(db, 'messages'), {
      conversation_id: router.query.id,
      sent_at: serverTimestamp(),
      text: newMessage,
      user: loggedInUser?.email,
    });
    setNewMessage('');
    scrollToBottom();
  };
  const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!newMessage) return;
      addMessageToDbAndUpdateLastSeen();
    }
  };
  const sendMessageOnClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    if (!newMessage) return;
    addMessageToDbAndUpdateLastSeen();
  };
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <>
      <StyledRecipientHeader>
        <RecipientAvatar recipient={recipient} recipientEmail={recipientEmail} />
        <StyledHeaderInfo>
          <StyleH3>{recipientEmail}</StyleH3>
          {recipient && (
            <span>Last active: {convertFirestoreTimestampToString(recipient.lastSeen)}</span>
          )}
        </StyledHeaderInfo>
        <StyledHeaderIcons>
          <IconButton>
            <AttachFile />
          </IconButton>
          <IconButton>
            <MoreVert />
          </IconButton>
        </StyledHeaderIcons>
      </StyledRecipientHeader>

      <StyledMessageContainer>
        {showMessages()}
        <EndOfMessagesForAutoScroll ref={endOfMessagesRef} />
      </StyledMessageContainer>

      <StyledInputContainer>
        <InsertEmoticon />
        <StyledInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={sendMessageOnEnter}
        />
        <IconButton onClick={sendMessageOnClick} disabled={!newMessage}>
          <Send />
        </IconButton>
        <IconButton>
          <Mic />
        </IconButton>
      </StyledInputContainer>
    </>
  );
};

export default ConversationScreen;
