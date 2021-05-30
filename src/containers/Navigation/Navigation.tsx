import Link from 'next/link';

const Navigation = () => {
    return (
        <div className='nav'>
            <div className='page'>
                <div className='main-container'>
                    <nav>
                        <Link href='/'><a>BINGO GAME</a></Link>
                    </nav>
                    {/* <ul>
                        <li>BINGO GAME</li>
                    </ul>
                    <ul className='flex'>
                        <li><Link href='/'><a>Home</a></Link></li>
                        <li><Link href='/'><a>Single Player</a></Link></li>
                        <li><Link href='/'><a>Multiplayer</a></Link></li>
                    </ul> */}
                </div>
            </div>
        </div>
    )
}

export default Navigation;