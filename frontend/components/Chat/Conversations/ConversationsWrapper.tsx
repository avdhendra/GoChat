import { useQuery } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { Session } from "next-auth";
import ConversationList from "./ConversationList";
import ConversationOperations from "../../../graphql/operations/conversation";
import { ConversationsData } from "../../../utils/types";
import { ConversationPopulated } from "../../../../backend/src/util/types";
import { useEffect } from "react";
import { useRouter } from "next/router";
interface ConversationsWrapperProps {
  session: Session;
}
const ConversationsWrapper: React.FC<ConversationsWrapperProps> = ({
  session,
}) => {
  const {
    data: conversationData,
    error: conversationError,
    loading: conversationLoading,
    subscribeToMore,
  } = useQuery<ConversationsData>(ConversationOperations.Queries.conversations); //as soon component render useQuery fire request

    const router=useRouter()
    const{query:{conversationId}}=router
    const onViewConversation = async (conversationId:string) => {
        /**Push the conversationID to the router query params */
       
       router.push({query:{conversationId}})
       
       
       
        /**2.Mark the conversation as Read */
    }
    
    
    
    
    
    
    const subscribeToNewConversation = () => {
        subscribeToMore({
            document: ConversationOperations.Subscriptions.conversationCreated,
            updateQuery: (prev, { subscriptionData }:{subscriptionData:{data:{conversationCreated:ConversationPopulated}}}) => {
             
                if (!subscriptionData.data) {
                 return prev
                }
                const newConversation = subscriptionData.data.conversationCreated;
             
             
             
                return Object.assign({}, prev, {
                    conversations:[subscriptionData.data.conversationCreated,...prev.conversations]
                })
            }
        })
    }
    

/**Execute subscription on mount */
    useEffect(() => {
    subscribeToNewConversation()
},[])






    
  return (
      <Box width={{ base: "100%", md: "400px" }} bg="whiteAlpha.50" py={6} px={3}
      display={{base:conversationId?"none":'flex',md:"flex"}}
      
      >
      {/**Skeleton loader */}
      <ConversationList
        session={session}
              conversations={conversationData?.conversations || []}
              onViewConversation={onViewConversation}
      />
    </Box>
  );
};
export default ConversationsWrapper;
