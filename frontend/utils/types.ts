 export interface CreateUsernameData{
    createUsername: {
        success: boolean;
        error: string;
    }
}
 export interface CreateUsernameVariables{
    username:string
}

export interface SearchUserInput{
    username: String;
}
export interface SearchUsersData{
    searchUsers:Array<SearchedUser>
}
export interface SearchedUser{
    id: string;
    username: string;
}