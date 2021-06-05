import Lobby from '../../containers/Lobby/Lobby';

const Page = () => {
    return (
        <div className='create-page'>
            <Lobby creator={false} />
        </div>
    )
};

export default Page;