import { useQuery } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { Session } from "next-auth";
import ConversationList from "./ConversationList";
import ConversationOperations from '../../../graphql/operations/conversation'
import { ConversationData } from "../../../utils/types";
interface ConversationsWrapperProps{
session:Session
}
const ConversationsWrapper: React.FC<ConversationsWrapperProps> = ({ session }) => {
    const { data: conversationData, error: conversationError, loading: conversationLoading } = useQuery<ConversationData>(ConversationOperations.Queries.conversations) //as soon component render useQuery fire request
    

    return (
        <Box width={{ base: "100%", md: "400px" }}  bg='whiteAlpha.50' py={6} px={3}>
            {/**Skeleton loader */}
            <ConversationList session={session} conversations={conversationData?.conversations||[]} />
        </Box>
    )
}
export default ConversationsWrapper;