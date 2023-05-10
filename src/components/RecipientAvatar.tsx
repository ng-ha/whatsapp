import Avatar from '@mui/material/Avatar';
import styled from 'styled-components';
import { useRecipient } from '../hooks/useRecipient';

const StyledAvatar = styled(Avatar)`
  margin: 5px 15px 5px 5px;
`;
const RecipientAvatar = ({ recipient, recipientEmail }: ReturnType<typeof useRecipient>) => {
  return recipient?.photoURL ? (
    <StyledAvatar src={recipient.photoURL} />
  ) : (
    <StyledAvatar>{recipientEmail && recipientEmail[0].toUpperCase()}</StyledAvatar>
  );
};

export default RecipientAvatar;
