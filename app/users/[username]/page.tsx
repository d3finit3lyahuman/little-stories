

export default async function Page({
    params,
} : {
    params: { username: string };
}) {
    const {username} = await params;

    return (
        <div className="container mx-auto py-5">
            <h1 className="mb-2 text-3xl font-bold">Welcome {username}</h1>
            <p className="text-muted-foreground">
                This is just a placeholder for now. Soon you will be able to see your stories here and edit your profile.
            </p>
        </div>
    );
}