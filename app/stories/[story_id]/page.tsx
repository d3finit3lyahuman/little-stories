export default async function Page({ params }: { params: { story_id: string } }){
    const { story_id } = await params;

    return (
        <div>
            <h1> ID: {story_id}</h1>
        </div>
    );
}
