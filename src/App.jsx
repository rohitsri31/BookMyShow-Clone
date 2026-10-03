import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Menu, X, MapPin, LocateFixed, UserRound, Clapperboard, CalendarDays, TicketCheck, Mail, Phone, ArrowRight, Camera, UsersRound, PlaySquare, HeartHandshake, RotateCcw, BellRing, Check, LogOut, UserCircle, Bookmark, Sparkles, ChevronLeft, ChevronRight, Star, Pause, Play, MoveUpRight, Copy, BadgePercent, Clock3 } from 'lucide-react';
import cities from './data/cities.json';
import searchItems from './data/search.json';
import movies from './data/movies.json';
import events from './data/events.json';
import premieres from './data/premieres.json';
import streamTitles from './data/stream.json';
import offers from './data/offers.json';
import { getCinemas, getSevenDates, getCinemaShowtimes, localDateKey, readStoredBooking, storeBooking, readBookings, storeBookings } from './utils/booking.js';
import { QRCodeSVG } from 'qrcode.react';
import { AppStateContext, useAppState } from './context/AppStateContext.jsx';

const navMain = ['Movies', 'Stream', 'Events', 'Plays', 'Sports', 'Activities'];
const navExtra = ['ListYourShow', 'Corporates', 'Offers', 'Gift Cards'];
const popular = cities.slice(0, 10);
const searchCatalog = [
  ...searchItems,
  ...movies.map(movie => ({ title: movie.title, type: 'Movie', meta: movie.genre, slug: movie.slug })),
  ...events.map(event => ({ title: event.title, type: 'Event', meta: `${event.category} · ${event.city}`, id: event.id })),
];

function App() {
  const [city, setCity] = useState(() => localStorage.getItem('showtime-city') || 'Mumbai');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('showtime-user')); } catch { return null; } });
  const [booking, setBooking] = useState(readStoredBooking);
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const navVisibleRef = useRef(true);
  const navTravelRef = useRef(0);
  const navDirectionRef = useRef('');
  const navIgnoreUntilRef = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };

  useEffect(() => { localStorage.setItem('showtime-city', city); }, [city]);
  useEffect(() => { if (user) localStorage.setItem('showtime-user', JSON.stringify(user)); else localStorage.removeItem('showtime-user'); }, [user]);
  useEffect(() => { storeBooking(booking); }, [booking]);
  useEffect(() => { window.scrollTo(0, 0); setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    let prev = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - prev;
      prev = current;

      // Keep the secondary nav open near the top. A short ignore window after
      // toggling prevents its own height transition from being read as intent.
      if (current < 100) {
        navTravelRef.current = 0;
        navDirectionRef.current = '';
        if (!navVisibleRef.current) {
          navVisibleRef.current = true;
          setNavVisible(true);
          navIgnoreUntilRef.current = performance.now() + 320;
        }
        return;
      }
      if (performance.now() < navIgnoreUntilRef.current || Math.abs(delta) < 1) return;

      const direction = delta > 0 ? 'down' : 'up';
      if (direction !== navDirectionRef.current) {
        navDirectionRef.current = direction;
        navTravelRef.current = 0;
      }
      navTravelRef.current += Math.abs(delta);

      const threshold = navVisibleRef.current ? 18 : 12;
      if (navTravelRef.current < threshold) return;
      const nextVisible = direction === 'up';
      navTravelRef.current = 0;
      if (nextVisible !== navVisibleRef.current) {
        navVisibleRef.current = nextVisible;
        setNavVisible(nextVisible);
        navIgnoreUntilRef.current = performance.now() + 320;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <AppStateContext.Provider value={{ city, setCity, user, setUser, booking, setBooking }}><div className="min-h-screen bg-canvas text-ink">
    <header className="topbar sticky top-0 z-40">
      <div className="topbar-inner shell">
        <button className="icon-button mobile-menu" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
        <Link to="/" className="wordmark" aria-label="ShowTime home"><span className="wordmark-icon"><Clapperboard size={19} strokeWidth={2.4} /></span><span>show<span>time</span></span></Link>
        <SearchBox mobileOpen={mobileSearchOpen} />
        <button className="city-chip" onClick={() => setModal('city')} aria-haspopup="dialog"><MapPin size={16}/><span>{city}</span><ChevronDown size={15}/></button>
        {user ? <div className="profile-wrap"><button className="avatar-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="avatar">{(user.name || user.phone || 'S')[0].toUpperCase()}</span><ChevronDown size={14}/></button>{profileOpen && <div className="profile-menu"><div className="profile-heading">{user.name || user.phone}</div><Link to="/profile" onClick={() => setProfileOpen(false)}><UserCircle size={16}/> Profile</Link><Link to="/bookings" onClick={() => setProfileOpen(false)}><Bookmark size={16}/> Bookings</Link><button onClick={() => { setUser(null); setProfileOpen(false); notify('You have signed out'); }}><LogOut size={16}/> Sign out</button></div>}</div> : <button className="signin-button" onClick={() => setModal('auth')}>Sign in</button>}
        <button className="icon-button mobile-search" aria-label={mobileSearchOpen ? 'Close search' : 'Search'} onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>{mobileSearchOpen ? <X /> : <Search />}</button>
      </div>
      <div className={`secondary-wrap ${navVisible ? '' : 'secondary-hidden'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <nav className="secondary-nav shell" aria-label="Main navigation"><div className="nav-group">{navMain.map((item, i) => <Link key={item} className={location.pathname.startsWith(i === 0 ? '/movies' : `/${item.toLowerCase()}`) || (i === 0 && location.pathname.startsWith('/movie')) ? 'nav-link active' : 'nav-link'} to={i === 0 ? '/movies' : `/${item.toLowerCase()}`}>{item}</Link>)}</div><div className="nav-group nav-right">{navExtra.map(item => <Link key={item} className="nav-link" to={item === 'Offers' ? '/offers' : '/'} onClick={item !== 'Offers' ? e => { e.preventDefault(); notify(`${item} is coming soon`); } : undefined}>{item}</Link>)}</div></nav>
      </div>
    </header>
    <Routes>
      <Route path="/" element={<HomePage city={city} />} />
      <Route path="/movies/*" element={<MoviesPage onCity={() => setModal('city')} />} />
      <Route path="/movie/:slug" element={<MovieDetails onNotify={notify} />} />
      <Route path="/showtimes/:movieId" element={<ShowtimesPage onSelectShow={(next) => { setBooking(next); navigate(`/seats/${encodeURIComponent(next.showtimeId)}`); }} onNotify={notify} />} />
      <Route path="/seats/:showtimeId" element={<SeatSelectionPage booking={booking} onContinue={setBooking} />} />
      <Route path="/checkout" element={<CheckoutPage booking={booking} onClear={() => setBooking(null)} onNotify={notify} />} />
      <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
      <Route path="/events/*" element={<ExperienceListingPage type="event" />} />
      <Route path="/plays/*" element={<ExperienceListingPage type="play" />} />
      <Route path="/sports/*" element={<ExperienceListingPage type="sports" />} />
      <Route path="/activities/*" element={<ExperienceListingPage type="activity" />} />
      <Route path="/stream/*" element={<StreamPage />} />
      <Route path="/offers/*" element={<OffersPage onNotify={notify} />} />
      <Route path="/profile" element={user ? <UserProfilePage user={user} onSave={setUser} onNotify={notify} /> : <SignInPrompt onSignIn={() => setModal('auth')} />} />
      <Route path="/bookings" element={user ? <BookingsPage onNotify={notify} /> : <SignInPrompt onSignIn={() => setModal('auth')} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <Footer onAction={notify} />
    <Modal open={modal === 'city'} title="Choose your city" onClose={() => setModal('')}><CityPicker city={city} onSelect={(next) => { setCity(next); setModal(''); if (location.pathname.startsWith('/movies')) navigate(`/movies/${next.toLowerCase().replaceAll(' ','-')}`); notify(`Showing experiences in ${next}`); }} onNotify={notify} /></Modal>
    <Modal open={modal === 'auth'} title="Get started" onClose={() => setModal('')}><AuthFlow onComplete={(nextUser) => { setUser(nextUser); setModal(''); notify('Welcome to ShowTime'); }} onNotify={notify} /></Modal>
    {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
  </div></AppStateContext.Provider>;
}

function SearchBox({ mobileOpen }) {
  const [query, setQuery] = useState(''); const [focused, setFocused] = useState(false); const wrap = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { const down = (e) => { if (!wrap.current?.contains(e.target)) setFocused(false); }; document.addEventListener('mousedown', down); return () => document.removeEventListener('mousedown', down); }, []);
  const results = useMemo(() => query.trim() ? searchCatalog.filter(item => `${item.title} ${item.type} ${item.meta}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : searchCatalog.slice(0, 4), [query]);
  const select = item => { setQuery(item.title); setFocused(false); if (item.type === 'Movie' && item.slug) navigate(`/movie/${item.slug}`); else navigate(({Event:'/events',Play:'/plays',Sports:'/sports',Activity:'/activities'})[item.type] || '/events'); };
  return <div className={`search-wrap ${mobileOpen ? 'mobile-search-open' : ''}`} ref={wrap}><div className={`search-box ${focused ? 'search-focused' : ''}`}><Search size={18} className="search-icon"/><input className="search-input" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onKeyDown={e => e.key === 'Escape' && setFocused(false)} placeholder="Search for Movies, Events, Plays, Sports and Activities" aria-label="Search movies and events" aria-expanded={focused}/>{query && <button className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><X size={15}/></button>}</div>
    {focused && <div className="suggestions" role="listbox"><div className="suggestions-label">{query ? 'Search results' : 'Trending searches'}</div>{results.length ? results.map((item, i) => <button key={`${item.type}-${item.title}`} role="option" className="suggestion" onClick={() => select(item)}><span className="suggestion-icon">{item.type === 'Movie' ? <Clapperboard size={17}/> : <CalendarDays size={17}/>}</span><span className="suggestion-copy"><b>{item.title}</b><small>{item.type} · {item.meta}</small></span><ArrowRight size={15} className="suggestion-arrow"/></button>) : <div className="no-results">No matches yet. Try another title.</div>}</div>}
  </div>;
}

function HomePage({ city }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setLoaded(true), 520); return () => window.clearTimeout(timer); }, []);
  const liveEvents = events.filter(event => event.type === 'event');
  const localEvents = [...liveEvents].sort((a, b) => Number(b.city === city) - Number(a.city === city));
  return <main className="home-page">
    <HeroCarousel loaded={loaded}/>
    <div className="shell home-content">
      <ContentSection title="Recommended Movies" seeAll="See All" to="/movies" loaded={loaded}><ScrollRow label="Recommended movies">{loaded ? movies.map(movie => <MovieCard movie={movie} key={movie.slug}/>) : Array.from({length:6}, (_, i) => <MovieSkeleton key={i}/>)}</ScrollRow></ContentSection>
      <StreamBanner loaded={loaded}/>
      <ContentSection title="The Best of Live Events" seeAll="See All" to="/events" loaded={loaded}><ScrollRow label="The best of live events">{loaded ? localEvents.map(event => <EventCard event={event} key={event.id}/>) : Array.from({length:4}, (_, i) => <EventSkeleton key={i}/>)}</ScrollRow></ContentSection>
      <ContentSection title="Premieres" subtitle="Big stories, first on ShowTime" seeAll="Explore" to="/stream" loaded={loaded}><ScrollRow label="Premieres">{loaded ? premieres.map(item => <PremiereCard item={item} key={item.id}/>) : Array.from({length:3}, (_, i) => <PremiereSkeleton key={i}/>)}</ScrollRow></ContentSection>
      <OffersStrip loaded={loaded}/>
      <ContentSection title="Outdoor Events" seeAll="See All" to="/activities" loaded={loaded}><ScrollRow label="Outdoor events">{loaded ? [...events.filter(event => event.type === 'activity' && event.category === 'OUTDOORS'),...localEvents.filter(event=>event.category==='OUTDOORS')].slice(0,5).map(event => <EventCard event={event} key={`outdoor-${event.id}`}/>) : Array.from({length:4}, (_, i) => <EventSkeleton key={i}/>)}</ScrollRow></ContentSection>
      <ContentSection title="Laughter Therapy" seeAll="See All" to="/events" loaded={loaded}><ScrollRow label="Comedy events">{loaded ? [...events.filter(event=>event.category==='COMEDY'),...localEvents.filter(event => event.category !== 'COMEDY')].slice(0,5).map(event => <EventCard event={event} key={`laugh-${event.id}`}/>) : Array.from({length:4}, (_, i) => <EventSkeleton key={i}/>)}</ScrollRow></ContentSection>
      <ContentSection title="Popular Events" seeAll="See All" to="/events" loaded={loaded}><ScrollRow label="Popular events">{loaded ? localEvents.map(event => <EventCard event={event} key={`popular-${event.id}`}/>) : Array.from({length:4}, (_, i) => <EventSkeleton key={i}/>)}</ScrollRow></ContentSection>
    </div>
  </main>;
}

const banners = [
  {kicker:'A LITTLE MAGIC, A LOT OF HEART', title:'The Paper Kingdom', copy:'Some adventures are bigger than the map.', action:'Discover the story', image:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2000&q=90', tone:'hero-green', tag:'NOW SHOWING'},
  {kicker:'YOUR WEEKEND, SORTED', title:'Make some noise', copy:'The best nights are the ones you sing along to.', action:'Find live music', image:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=2000&q=90', tone:'hero-violet', tag:'LIVE THIS WEEK'},
  {kicker:'ONE STAGE. A THOUSAND LAUGHS.', title:'Laughs After Dark', copy:'Bring your friends. Leave your serious face at home.', action:'Book a good time', image:'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=2000&q=90', tone:'hero-amber', tag:'LIVE COMEDY'}
];

function HeroCarousel({loaded}) {
  const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused || !loaded || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const timer = window.setInterval(() => setIndex(i => (i+1)%banners.length), 5200); return () => window.clearInterval(timer); }, [paused, loaded]);
  const move = direction => setIndex(i => (i + direction + banners.length) % banners.length);
  const touchStart=useRef(null);
  if (!loaded) return <div className="hero-skeleton shell"><div className="skeleton-shine"/></div>;
  const banner = banners[index];
  return <section className={`hero-carousel shell ${banner.tone}`} aria-roledescription="carousel" aria-label="Featured promotions" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }} onTouchStart={e=>{touchStart.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touchStart.current===null)return;const delta=e.changedTouches[0].clientX-touchStart.current;if(Math.abs(delta)>45)move(delta<0?1:-1);touchStart.current=null;}}>
    {banners.map((item, i) => <div className={`hero-slide ${i === index ? 'hero-slide-active' : ''}`} key={item.title} aria-hidden={i !== index} style={{backgroundImage:`linear-gradient(90deg, rgba(16,19,29,.91) 0%, rgba(16,19,29,.66) 42%, rgba(16,19,29,.12) 100%),url("${item.image}")`}}><div className="hero-copy"><span className="hero-tag">{item.tag}</span><div className="hero-kicker">{item.kicker}</div><h1>{item.title}</h1><p>{item.copy}</p><Link to={item.tag === 'LIVE THIS WEEK' ? '/events' : '/movies'} className="hero-cta">{item.action}<ArrowRight size={17}/></Link></div></div>)}
    <button className="hero-arrow hero-prev" aria-label="Previous banner" onClick={() => move(-1)}><ChevronLeft/></button><button className="hero-arrow hero-next" aria-label="Next banner" onClick={() => move(1)}><ChevronRight/></button>
    <div className="hero-controls"><div className="hero-dots" role="tablist" aria-label="Choose featured banner">{banners.map((item,i) => <button key={item.title} role="tab" aria-label={`Show banner ${i+1}`} aria-selected={i === index} className={i===index?'hero-dot active':'hero-dot'} onClick={() => setIndex(i)}/>)}</div><button className="hero-pause" aria-label={paused?'Play carousel':'Pause carousel'} onClick={() => setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button></div>
  </section>;
}

function ContentSection({title,subtitle,seeAll,to,loaded,children}) { return <section className="content-section"><div className="section-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{seeAll&&<Link to={to} className="see-all">{seeAll}<ChevronRight size={15}/></Link>}</div>{children}</section>; }

function ScrollRow({label,children}) {
  const ref=useRef(null); const [canLeft,setCanLeft]=useState(false); const [canRight,setCanRight]=useState(true);
  const update=()=>{if(!ref.current)return;setCanLeft(ref.current.scrollLeft>4);setCanRight(ref.current.scrollLeft+ref.current.clientWidth<ref.current.scrollWidth-5);};
  useEffect(()=>{update();const el=ref.current;if(!el)return;el.addEventListener('scroll',update,{passive:true});const observer=new ResizeObserver(update);observer.observe(el);return()=>{el.removeEventListener('scroll',update);observer.disconnect();};},[]);
  const scroll=d=>ref.current?.scrollBy({left:d*ref.current.clientWidth*.8,behavior:'smooth'});
  return <div className="scroll-row-wrap"><button className={`row-arrow row-arrow-left ${canLeft?'':'row-arrow-disabled'}`} aria-label={`Scroll ${label} left`} onClick={()=>scroll(-1)}><ChevronLeft/></button><div className="scroll-row" ref={ref}>{children}</div><button className={`row-arrow row-arrow-right ${canRight?'':'row-arrow-disabled'}`} aria-label={`Scroll ${label} right`} onClick={()=>scroll(1)}><ChevronRight/></button></div>;
}

function MovieCard({movie}) { return <Link to={`/movie/${movie.slug}`} className="movie-card"><div className="movie-poster" style={{backgroundColor:movie.color}}><img src={movie.poster} alt={`${movie.title} poster`} loading="lazy"/><div className="rating-band"><Star size={14} fill="currentColor"/><b>{movie.rating}/10</b><span>{movie.votes} Votes</span></div></div><div className="movie-title">{movie.title}</div><div className="movie-genre">{movie.genre}</div></Link>; }
function EventCard({event}) { const [saved,setSaved]=useState(false);const route=event.type==='play'?'/plays':event.type==='sports'?'/sports':event.type==='activity'?'/activities':'/events';return <article className="event-card"><div className="event-media-wrap"><Link to={route} className="event-image" style={{backgroundColor:event.color}}><img src={event.image} alt={event.title} loading="lazy"/><span className="event-category">{event.category}</span></Link><button className={`event-save ${saved?'saved':''}`} aria-label={`${saved?'Remove':'Save'} ${event.title}`} aria-pressed={saved} onClick={()=>setSaved(!saved)}><span>{saved?'♥':'♡'}</span></button></div><Link to={route} className="event-info"><div className="event-date">{event.date}</div><h3>{event.title}</h3><div className="event-venue">{event.venue}</div><div className="event-price">{event.price}</div></Link></article>; }
function PremiereCard({item}) { return <Link to="/stream" className={`premiere-card premiere-${item.tone}`}><img src={item.image} alt="" loading="lazy"/><div className="premiere-shade"/><div className="premiere-copy"><span>{item.label}</span><h3>{item.title}</h3><p>{item.subtitle}</p><b>Watch now <MoveUpRight size={14}/></b></div></Link>; }

function StreamBanner({loaded}) { return <Link to="/stream" className={`stream-banner ${loaded?'':'stream-loading'}`}><div className="stream-art"><span className="stream-orb orb-a"/><span className="stream-orb orb-b"/><span className="stream-play"><Play size={28} fill="currentColor"/></span><span className="stream-screen">ST</span></div><div className="stream-copy"><div className="stream-brand"><span className="stream-brand-mark">S</span> SHOWTIME <b>STREAM</b></div><h2>The best stories<br/>stay with you.</h2><p>New premieres. Big feelings. Watch wherever you are.</p><span className="stream-link">Explore Stream <ArrowRight size={16}/></span></div><span className="stream-side-note">YOUR NEXT WATCH IS WAITING</span></Link>; }

function OffersStrip({loaded}) { const offers=[{bank:'NORTHSTAR BANK',kind:'CREDIT CARDS',headline:'A little more fun for less.',detail:'Save ₹150 on your next movie night',code:'NORTHSTAR150',style:'offer-rose'},{bank:'WAVE PAY',kind:'UPI PAYMENTS',headline:'Pay quick. Play more.',detail:'Get 10% back on event tickets',code:'WAVE10',style:'offer-indigo'},{bank:'CLOUD NINE',kind:'PREMIUM MEMBERS',headline:'Good plans come with perks.',detail:'Unlock exclusive member offers',code:'CLOUDPERKS',style:'offer-teal'}];return <section className="offers-section"><div className="section-heading"><div><h2>Offers for the good times</h2><p>More reasons to make a plan.</p></div><Link to="/offers" className="see-all">All offers<ChevronRight size={15}/></Link></div><div className="offers-row">{offers.map((offer,i)=><Link to="/offers" className={`offer-card ${offer.style} ${loaded?'':'offer-skeleton'}`} key={offer.bank}><span className="offer-corner">{offer.kind}</span><div className="offer-bank">{offer.bank}</div><h3>{offer.headline}</h3><p>{offer.detail}</p><span className="offer-code">USE CODE <b>{offer.code}</b></span><span className="offer-stamp">{i===0?'₹':i===1?'%':'✦'}</span></Link>)}</div></section>; }
function MovieSkeleton(){return <div className="movie-skeleton"><div className="skeleton-shine"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>}
function EventSkeleton(){return <div className="event-skeleton"><div className="skeleton-shine"/><div className="skeleton-line short"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>}
function PremiereSkeleton(){return <div className="premiere-skeleton"><div className="skeleton-shine"/></div>}

function MoviesPage({onCity}) {
  const {city}=useAppState();
  const params=useParams(); const routeCity=params['*']?.split('/')[0];
  const displayCity=routeCity ? cities.find(c=>c.name.toLowerCase().replaceAll(' ','-')===routeCity.toLowerCase())?.name || routeCity.replaceAll('-',' ') : city;
  const [tab,setTab]=useState('Now Showing'),[filtersOpen,setFiltersOpen]=useState(false),[page,setPage]=useState(1);
  const [selected,setSelected]=useState({Languages:[],Genres:[],Format:[]});
  const [openGroups,setOpenGroups]=useState({Languages:true,Genres:true,Format:false});
  const options={Languages:['Hindi','English','Tamil','Telugu','Kannada','Malayalam'],Genres:['Action','Adventure','Animation','Comedy','Drama','Family','Fantasy','Mystery','Romance','Sci-Fi','Thriller'],Format:['2D','3D','IMAX','4DX']};
  const toggle=(group,value)=>{setSelected(s=>({...s,[group]:s[group].includes(value)?s[group].filter(x=>x!==value):[...s[group],value]}));setPage(1);};
  const filtered=movies.filter(movie=>{
    const tabMatch=tab==='Now Showing'?movie.tab==='Now Showing':tab==='Coming Soon'?movie.tab==='Coming Soon':movie.tab==='Exclusive'?movie.tab==='Exclusive':true;
    return tabMatch && (!selected.Languages.length||selected.Languages.some(x=>movie.languages.includes(x))) && (!selected.Genres.length||selected.Genres.some(x=>movie.genres.some(g=>g.toLowerCase()===x.toLowerCase()))) && (!selected.Format.length||selected.Format.some(x=>movie.formats.includes(x)));
  });
  const activeCount=Object.values(selected).flat().length;
  const clear=()=>{setSelected({Languages:[],Genres:[],Format:[]});setPage(1);};
  const pageSize=12,pages=Math.max(1,Math.ceil(filtered.length/pageSize)),current=filtered.slice((page-1)*pageSize,page*pageSize);
  return <main className="movies-page shell">
    <div className="movies-heading"><div><div className="eyebrow">FIND YOUR NEXT FAVOURITE</div><h1>Movies in {displayCity}</h1><p>Book tickets for the latest movies playing near you.</p></div><button className="city-inline" onClick={onCity}><MapPin size={16}/>{displayCity}<ChevronDown size={14}/></button></div>
    <div className="movie-tabs" role="tablist" aria-label="Movie availability">{['Now Showing','Coming Soon','Exclusive'].map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?'movie-tab active':'movie-tab'} onClick={()=>{setTab(t);setPage(1);}}>{t}</button>)}</div>
    <div className="movie-listing-layout">
      <aside className={`movie-filter-panel ${filtersOpen?'filters-open':''}`} aria-label="Filter movies">
        <div className="filter-head"><b>Filters</b>{activeCount>0&&<button onClick={clear}>Clear all</button>}</div>
        {Object.entries(options).map(([group,values])=><div className="filter-group" key={group}><button className="filter-group-title" aria-expanded={openGroups[group]} onClick={()=>setOpenGroups(s=>({...s,[group]:!s[group]}))}><span>{group}{selected[group].length>0&&<i>{selected[group].length}</i>}</span><ChevronDown size={16} className={openGroups[group]?'':'collapsed'}/></button>{openGroups[group]&&<div className="filter-options">{values.map(value=><label key={value} className="filter-option"><input type="checkbox" checked={selected[group].includes(value)} onChange={()=>toggle(group,value)}/><span className="custom-check"><Check size={12}/></span><span>{value}</span></label>)}</div>}</div>)}
      </aside>
      <section className="movie-results" aria-label={`${tab} movies`}>
        <div className="listing-toolbar"><div className="active-filters"><button className="mobile-filter-toggle" onClick={()=>setFiltersOpen(!filtersOpen)}><span>Filters{activeCount>0?` (${activeCount})`:''}</span><ChevronDown size={14}/></button>{options.Languages.slice(0,4).map(language=><button key={language} className={`quick-chip ${selected.Languages.includes(language)?'selected':''}`} onClick={()=>toggle('Languages',language)}>{language}</button>)}<button className="quick-chip" onClick={()=>setOpenGroups(s=>({...s,Genres:true}))}>More filters <ChevronDown size={13}/></button></div><span className="result-count">{filtered.length} movies</span></div>
        {activeCount>0&&<div className="selected-filters">{Object.entries(selected).flatMap(([g,values])=>values.map(v=><button key={`${g}-${v}`} onClick={()=>toggle(g,v)}>{v}<X size={12}/></button>))}<button className="clear-selected" onClick={clear}>Clear all</button></div>}
        {current.length?<div className="listing-grid">{current.map(movie=><MovieCard movie={movie} key={movie.slug}/>)}</div>:<div className="empty-movies"><span>🎬</span><h3>No movies match these filters</h3><p>Try removing a filter to see more titles.</p><button onClick={clear}>Clear filters</button></div>}
        {pages>1&&<div className="pagination"><button disabled={page===1} aria-label="Previous page" onClick={()=>{setPage(page-1);window.scrollTo({top:0,behavior:'smooth'});}}><ChevronLeft size={17}/></button>{Array.from({length:pages},(_,i)=><button key={i} className={page===i+1?'current-page':''} onClick={()=>{setPage(i+1);window.scrollTo({top:0,behavior:'smooth'});}}>{i+1}</button>)}<button disabled={page===pages} aria-label="Next page" onClick={()=>{setPage(page+1);window.scrollTo({top:0,behavior:'smooth'});}}><ChevronRight size={17}/></button></div>}
      </section>
    </div>
  </main>;
}

function ShowtimesPage({onSelectShow,onNotify}) {
  const {city}=useAppState();
  const {movieId}=useParams(); const navigate=useNavigate();
  const movie=movies.find(m=>String(m.movieId)===movieId||m.slug===movieId);
  const dates=useMemo(()=>getSevenDates(),[]); const [dateIndex,setDateIndex]=useState(0);
  const [language,setLanguage]=useState('All languages'),[price,setPrice]=useState('Any price'),[time,setTime]=useState('Any time'),[format,setFormat]=useState('Any format'),[query,setQuery]=useState(''),[infoCinema,setInfoCinema]=useState(null);
  const cinemasForCity=getCinemas(city);
  if(!movie)return <PlaceholderPage title="Movie not found" subtitle="Choose a movie to see its showtimes."/>;
  const chosenDate=dates[dateIndex];
  const cinemaRows=cinemasForCity.map(cinema=>{
    let shows=getCinemaShowtimes(cinema,chosenDate.date,movie.movieId);
    if(language!=='All languages'&&!movie.languages.includes(language))shows=[];
    if(format!=='Any format')shows=shows.filter(s=>s.formats.includes(format));
    if(price==='Under ₹200')shows=shows.filter(s=>Math.min(...s.categories.map(c=>c.price))<200);
    if(price==='₹200–₹350')shows=shows.filter(s=>Math.min(...s.categories.map(c=>c.price))>=200&&Math.min(...s.categories.map(c=>c.price))<=350);
    if(price==='₹350+')shows=shows.filter(s=>Math.min(...s.categories.map(c=>c.price))>350);
    if(time!=='Any time')shows=shows.filter(s=>{const hour=new Date(s.start).getHours();return time==='Morning'?hour<12:time==='Afternoon'?hour>=12&&hour<17:time==='Evening'?hour>=17&&hour<21:hour>=21;});
    return {cinema,shows};
  }).filter(x=>x.shows.length&&x.cinema.name.toLowerCase().includes(query.toLowerCase()));
  const selectShow=(cinema,show)=>onSelectShow({movieId:movie.movieId,movieSlug:movie.slug,movieTitle:movie.title,city,cinemaId:cinema.id,cinemaName:cinema.name,cinemaAddress:cinema.address,dateKey:chosenDate.key,dateLabel:chosenDate.date.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}),time:show.time,showtimeId:show.id,priceCategories:show.categories,pricePerSeat:show.categories[1].price,poster:movie.poster});
  return <main className="showtimes-page shell"><div className="showtimes-breadcrumb"><Link to={`/movie/${movie.slug}`}>‹ Back to movie</Link><span>Showtimes</span></div><section className="showtimes-title"><img src={movie.poster} alt=""/><div><div className="eyebrow">BOOK YOUR MOVIE NIGHT</div><h1>{movie.title}</h1><p>{movie.duration} mins <i/> {movie.certificate} <i/> {movie.genres.slice(0,2).join(' · ')}</p></div><button className="show-city" onClick={()=>onNotify(`Showing cinemas in ${city}`)}><MapPin size={15}/>{city}<ChevronDown size={14}/></button></section>
    <div className="show-date-strip" role="tablist" aria-label="Choose a date">{dates.map((d,i)=><button key={d.key} role="tab" aria-selected={i===dateIndex} className={i===dateIndex?'date-choice active':'date-choice'} onClick={()=>setDateIndex(i)}><span>{d.weekday}</span><b>{d.day}</b><small>{d.month}</small></button>)}</div>
    <section className="show-filters" aria-label="Showtime filters"><label className="cinema-search"><Search size={16}/><input placeholder="Search cinemas" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear cinema search"><X size={14}/></button>}</label><select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Filter language"><option>All languages</option>{movie.languages.map(x=><option key={x}>{x}</option>)}</select><select value={price} onChange={e=>setPrice(e.target.value)} aria-label="Filter price"><option>Any price</option><option>Under ₹200</option><option>₹200–₹350</option><option>₹350+</option></select><select value={time} onChange={e=>setTime(e.target.value)} aria-label="Preferred time"><option>Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option></select><select value={format} onChange={e=>setFormat(e.target.value)} aria-label="Special format"><option>Any format</option>{['2D','3D','IMAX','4DX'].map(x=><option key={x}>{x}</option>)}</select></section>
    <div className="cinema-list-heading"><h2>{chosenDate.weekday}, {chosenDate.day} {chosenDate.month} <span>·</span> {cinemaRows.length} cinemas</h2><div className="show-legend"><span><i className="legend-dot available-dot"/>Available</span><span><i className="legend-dot filling-dot"/>Filling fast</span><span><i className="legend-dot sold-dot"/>Sold out</span></div></div>
    <div className="cinema-list">{cinemaRows.length?cinemaRows.map(({cinema,shows})=><article className="cinema-card" key={cinema.id}><div className="cinema-meta"><div className="cinema-name-row"><h3>{cinema.name}</h3><button className="cinema-info" aria-label={`About ${cinema.name}`} onClick={()=>setInfoCinema(cinema)}>i</button></div><p>{cinema.distance} · {cinema.area}</p><div className="cinema-tags"><span className="mticket"><TicketCheck size={12}/>M-Ticket</span><span>{cinema.formats.join(' · ')}</span></div></div><div className="show-pill-row">{shows.map(show=><button key={show.id} disabled={show.status==='sold'} className={`showtime-pill ${show.status}`} title={show.categories.map(c=>`${c.name} ₹${c.price}`).join(' · ')} onClick={()=>selectShow(cinema,show)}><b>{show.time}</b><span className="show-tooltip">{show.categories.map(c=><span key={c.name}>{c.name}<b>₹{c.price}</b></span>)}</span></button>)}</div></article>):<div className="no-cinemas"><Clapperboard size={25}/><b>No showtimes found</b><span>Try another date or clear your filters.</span><button onClick={()=>{setQuery('');setLanguage('All languages');setPrice('Any price');setTime('Any time');setFormat('Any format');}}>Clear filters</button></div>}</div>
    <Modal open={Boolean(infoCinema)} title={infoCinema?.name||'Cinema details'} onClose={()=>setInfoCinema(null)}>{infoCinema&&<div className="cinema-info-modal"><div className="cinema-info-pin"><MapPin size={19}/></div><b>{infoCinema.name}</b><p>{infoCinema.address}</p><div>{infoCinema.facilities.map(f=><span key={f}>{f}</span>)}</div><button className="button-primary" onClick={()=>setInfoCinema(null)}>Got it</button></div>}</Modal>
  </main>;
}

function SeatSelectionPage({booking,onContinue}) {
  const {showtimeId}=useParams(); const navigate=useNavigate(); const [count,setCount]=useState(booking?.ticketCount||2); const [selected,setSelected]=useState(booking?.seats||[]);
  useEffect(()=>{if(!booking||booking.showtimeId!==decodeURIComponent(showtimeId))navigate('/movies',{replace:true});},[booking,showtimeId,navigate]);
  if(!booking||booking.showtimeId!==decodeURIComponent(showtimeId))return <PlaceholderPage title="Select a showtime first" subtitle="Choose a movie showtime before selecting seats."/>;
  const tierFor=row=>row<='D'?'Silver':row<='I'?'Gold':'Platinum';
  const priceFor=row=>booking.priceCategories?.find(c=>c.name===tierFor(row))?.price||booking.pricePerSeat;
  const sold=(row,n)=>((row.charCodeAt(0)*7+n*11+booking.cinemaId.length)%19===0)||((row.charCodeAt(0)+n*13)%31===0);
  const toggleSeat=seat=>setSelected(current=>{if(current.includes(seat))return current.filter(s=>s!==seat);if(current.length>=count)return current;return [...current,seat];});
  const total=selected.reduce((sum,seat)=>sum+priceFor(seat.slice(0,1)),0);
  const tiers=[{name:'Silver',rows:'A – D',price:priceFor('A'),letters:'ABCD'},{name:'Gold',rows:'E – I',price:priceFor('E'),letters:'EFGHI'},{name:'Platinum',rows:'J – N',price:priceFor('J'),letters:'JKLMN'}];
  return <main className="seat-page shell"><div className="showtimes-breadcrumb"><button onClick={()=>navigate(-1)}>‹ Back to showtimes</button><span>Choose your seats</span></div><div className="seat-movie-summary"><div><h1>{booking.movieTitle}</h1><p>{booking.cinemaName} · {booking.dateLabel} · {booking.time}</p></div><div className="ticket-count-control"><span>Tickets</span><button aria-label="Remove one ticket" disabled={count<=1} onClick={()=>{setCount(c=>Math.max(1,c-1));setSelected(s=>s.slice(0,Math.max(1,count-1)));}}>−</button><b>{count}</b><button aria-label="Add one ticket" disabled={count>=10} onClick={()=>setCount(c=>Math.min(10,c+1))}>+</button></div></div>
    <div className="seat-layout-shell"><div className="seat-tier-legend">{tiers.map(t=><div key={t.name}><span className={`tier-swatch ${t.name.toLowerCase()}`}/><b>{t.name}</b><small>₹{t.price}</small></div>)}</div><div className="screen-area"><div className="screen-curve"/><span>SCREEN THIS WAY</span></div><div className="seat-map" role="grid" aria-label="Movie theater seat selection">{'ABCDEFGHIJKLMN'.split('').map(row=><div className="seat-row" role="row" key={row}><span className="seat-row-label" role="rowheader">{row}</span><div className="seat-cells">{Array.from({length:14},(_,i)=>{const number=i+1,seat=`${row}${number}`,isSold=sold(row,number),isSelected=selected.includes(seat);return <button key={seat} role="gridcell" aria-label={`${seat}, ${isSold?'sold':isSelected?'selected':'available'}, ${tierFor(row)} ₹${priceFor(row)}`} aria-pressed={isSelected} disabled={isSold} className={`seat-cell ${tierFor(row).toLowerCase()} ${isSold?'seat-sold':''} ${isSelected?'seat-selected':''}`} onClick={()=>toggleSeat(seat)}>{number}</button>;})}</div></div>)}</div><div className="seat-status-legend"><span><i className="seat-legend available-seat"/>Available</span><span><i className="seat-legend selected-seat"/>Selected</span><span><i className="seat-legend sold-seat"/>Sold</span></div></div>
    <div className="seat-bottom-bar"><div><span>{selected.length} of {count} seats selected</span><b>₹{total.toLocaleString('en-IN')}</b></div><button disabled={selected.length!==count} onClick={()=>{onContinue({...booking,seats:selected,ticketCount:count,total,holdExpiresAt:Date.now()+5*60*1000});navigate('/checkout');}}>Pay ₹{total.toLocaleString('en-IN')} <ArrowRight size={17}/></button></div>
  </main>;
}

function CheckoutPage({booking,onClear,onNotify}) {
  const {user}=useAppState();
  const navigate=useNavigate(); const [now,setNow]=useState(Date.now()); const [couponText,setCouponText]=useState(''); const [coupon,setCoupon]=useState(null); const [couponError,setCouponError]=useState(''); const [email,setEmail]=useState(user?.email||''); const [phone,setPhone]=useState((user?.phone||'').replace('+91 ','').replace(/\D/g,'')); const [errors,setErrors]=useState({}); const [payment,setPayment]=useState('UPI'); const expired=useRef(false);
  useEffect(()=>{if(!booking){navigate('/',{replace:true});return;}const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(id);},[booking,navigate]);
  const remaining=Math.max(0,((booking?.holdExpiresAt||0)-now));
  useEffect(()=>{if(booking&&remaining<=0&&!expired.current){expired.current=true;onClear();onNotify('Your seat hold expired. Please choose seats again.');navigate(`/showtimes/${booking.movieId}`,{replace:true});}},[remaining,booking,onClear,onNotify,navigate]);
  if(!booking)return <PlaceholderPage title="No seats selected" subtitle="Choose a showtime and seats to continue."/>;
  const subtotal=booking.total||0,fee=booking.ticketCount*24.5,discount=coupon?.type==='percent'?Math.min(coupon.cap||Infinity,Math.round(subtotal*coupon.value/100)):coupon?.type==='flat'?Math.min(subtotal,coupon.value):0,total=subtotal+fee-discount;
  const applyCoupon=()=>{const code=couponText.trim().toUpperCase();const rules={SHOWTIME10:{type:'percent',value:10},FIRST50:{type:'flat',value:50},NORTHSTAR150:{type:'flat',value:150},WAVE10:{type:'percent',value:10},CLOUDPERKS:{type:'percent',value:15,cap:250}};const rule=rules[code];if(!rule){setCoupon(null);setCouponError('That code didn’t work. Try one of the offers shown here.');return;}setCoupon({code,...rule});setCouponError('');onNotify(`${code} applied`);};
  const submit=e=>{e.preventDefault();const next={};if(!/^\S+@\S+\.\S+$/.test(email))next.email='Enter a valid email address';if(!/^\d{10}$/.test(phone.replace(/\D/g,'')))next.phone='Enter a valid 10-digit phone number';setErrors(next);if(Object.keys(next).length)return;
    const bookingId=`ST${new Date().getFullYear()}${Math.random().toString(36).slice(2,8).toUpperCase()}`;const record={...booking,bookingId,email,phone:phone.replace(/\D/g,''),paymentMethod:payment,subtotal,convenienceFee:fee,discount,total,couponCode:coupon?.code||null,createdAt:new Date().toISOString()};storeBookings([record,...readBookings()]);onClear();navigate(`/confirmation/${bookingId}`);
  };
  const timer=`${String(Math.floor(remaining/60000)).padStart(2,'0')}:${String(Math.floor((remaining%60000)/1000)).padStart(2,'0')}`;
  return <main className="checkout-page shell"><div className="checkout-top"><Link to={`/seats/${encodeURIComponent(booking.showtimeId)}`}>‹ Back to seats</Link><div className="hold-timer"><span>Seats held for</span><b>{timer}</b></div></div><div className="checkout-layout"><section className="checkout-main"><div className="checkout-card order-card"><div className="checkout-card-heading"><h1>Your order</h1><span>STEP 2 OF 2</span></div><div className="order-movie"><img src={booking.poster} alt=""/><div><b>{booking.movieTitle}</b><span>{booking.cinemaName}</span><span>{booking.dateLabel} · {booking.time}</span><span>{booking.city}</span></div></div><div className="order-seat-row"><span>Seats</span><b>{booking.seats.join(', ')}</b></div><div className="price-breakdown"><div><span>Tickets ({booking.ticketCount})</span><b>₹{subtotal.toLocaleString('en-IN')}</b></div><div><span>Convenience fee</span><b>₹{fee.toFixed(2)}</b></div>{discount>0&&<div className="discount-row"><span>Offer ({coupon.code})</span><b>−₹{discount.toFixed(2)}</b></div>}<div className="total-row"><span>Grand total</span><b>₹{total.toFixed(2)}</b></div></div></div>
      <div className="checkout-card coupon-card"><h2>Offers & discounts</h2><div className="coupon-input"><input value={couponText} onChange={e=>{setCouponText(e.target.value);setCouponError('');}} placeholder="Enter coupon code" aria-label="Coupon code"/><button onClick={applyCoupon}>Apply</button></div>{coupon&&<div className="coupon-success"><Check size={14}/>{coupon.code} applied successfully <button onClick={()=>setCoupon(null)}>Remove</button></div>}{couponError&&<div className="coupon-error">{couponError}</div>}<div className="coupon-hints">Try {['SHOWTIME10','FIRST50','NORTHSTAR150','WAVE10','CLOUDPERKS'].map((code,i)=><React.Fragment key={code}>{i>0?' · ':''}<button onClick={()=>{setCouponText(code);setCouponError('');}}>{code}</button></React.Fragment>)}</div></div>
      <form id="checkout-form" className="checkout-card contact-card" onSubmit={submit} noValidate><h2>Contact details</h2><p>Your tickets will be sent here.</p><div className="contact-fields"><label>Email address<input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(s=>({...s,email:''}));}} placeholder="you@example.com"/>{errors.email&&<small>{errors.email}</small>}</label><label>Mobile number<div className="checkout-phone"><span>🇮🇳 +91</span><input inputMode="numeric" maxLength={10} value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,'').slice(0,10));setErrors(s=>({...s,phone:''}));}} placeholder="10-digit mobile number"/></div>{errors.phone&&<small>{errors.phone}</small>}</label></div></form>
      <div className="checkout-card payment-card"><h2>Payment method</h2><div className="payment-options">{['UPI','Card','Net Banking','Wallet'].map(method=><button key={method} className={payment===method?'payment-option selected':'payment-option'} onClick={()=>setPayment(method)}><span className="payment-radio"/><span>{method}</span><small>{method==='UPI'?'GPay · PhonePe · Paytm':method==='Card'?'Credit or debit card':method==='Net Banking'?'All major banks':'Wallet balance'}</small></button>)}</div><div className="mock-payment-note"><Check size={14}/> Demo checkout · no real payment will be taken</div></div>
    </section><aside className="checkout-aside"><div className="secure-note"><span>🔒</span><div><b>Safe & secure checkout</b><small>Your booking is protected.</small></div></div><div className="checkout-total"><div><span>Total payable</span><b>₹{total.toFixed(2)}</b></div><small>Inclusive of all applicable fees</small><button form="checkout-form" type="submit" disabled={remaining<=0}>Pay ₹{total.toFixed(2)} <ArrowRight size={16}/></button><p>By continuing, you agree to ShowTime’s Terms &amp; Conditions.</p></div><div className="help-card"><b>Need help?</b><span>Our team is here for you, any time.</span><button onClick={()=>onNotify('Customer care is here to help')}>Get support <ArrowRight size={13}/></button></div></aside></div></main>;
}

function ConfirmationPage() {
  const {bookingId}=useParams(); const booking=readBookings().find(b=>b.bookingId===bookingId);
  if(!booking)return <PlaceholderPage title="Ticket not found" subtitle="This confirmation link doesn’t match a saved booking."/>;
  return <main className="confirmation-page shell"><div className="confirmation-success"><span><Check size={29}/></span><h1>You’re all set!</h1><p>Your booking is confirmed. Get ready for a great show.</p></div><section className="ticket-confirmation"><div className="ticket-confirmation-main"><div className="ticket-confirmation-head"><div><span>SHOWTIME E-TICKET</span><b>BOOKING ID · {booking.bookingId}</b></div><span className="confirmed-label"><Check size={13}/> CONFIRMED</span></div><div className="confirmed-movie"><img src={booking.poster} alt=""/><div><h2>{booking.movieTitle}</h2><p>{booking.cinemaName}</p><p>{booking.cinemaAddress}</p></div></div><div className="confirmed-details"><div><span>DATE & TIME</span><b>{booking.dateLabel}</b><b>{booking.time}</b></div><div><span>SEATS</span><b>{booking.seats.join(', ')}</b></div><div><span>VENUE</span><b>{booking.city}</b></div></div><div className="ticket-confirmation-foot"><span>Show this ticket at the cinema entrance.</span><b>PAID · ₹{booking.total.toFixed(2)}</b></div></div><div className="ticket-qr"><QRCodeSVG value={`SHOWTIME:${booking.bookingId}:${booking.movieTitle}:${booking.seats.join(',')}`} title={`QR code for booking ${booking.bookingId}`} size={145} level="M" includeMargin/><span>SCAN AT THE CINEMA</span></div></section><div className="confirmation-actions"><button className="button-primary" onClick={()=>window.print()}>Download ticket <ArrowRight size={15}/></button><Link to="/" className="button-light">Back to home</Link></div><p className="confirmation-help">A copy of your ticket is ready. Have a wonderful time!</p></main>;
}

function MovieDetails({onNotify}) {
  const {slug}=useParams(); const movie=movies.find(m=>m.slug===slug);
  if(!movie)return <PlaceholderPage title="Movie not found" subtitle="We couldn’t find that title in our movie guide."/>;
  const related=movies.filter(m=>m.slug!==movie.slug&&m.genres.some(g=>movie.genres.includes(g))).slice(0,6);
  const release=new Date(`${movie.releaseDate}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  return <main className="movie-detail-page">
    <section className="detail-hero" style={{'--detail-image':`url("${movie.poster}")`}}><div className="detail-hero-inner shell"><div className="detail-poster"><img src={movie.poster} alt={`${movie.title} poster`}/></div><div className="detail-info"><div className="detail-kicker">{movie.tab==='Coming Soon'?'COMING SOON':movie.tab==='Exclusive'?'SHOWTIME EXCLUSIVE':'NOW SHOWING'}</div><h1>{movie.title}</h1><div className="detail-rating"><div className="rating-circle"><Star size={18} fill="currentColor"/><b>{movie.rating}</b><small>/10</small></div><div className="rating-copy"><b>{movie.votes} ratings</b><span>Audience score</span></div><button onClick={()=>onNotify('Sign in to add your rating')}>Rate this movie</button></div><div className="detail-facts"><span>{movie.duration} mins</span><i/> <span>{movie.certificate}</span><i/> <span>{release}</span></div><div className="detail-chips">{movie.formats.map(x=><span key={x}>{x}</span>)}{movie.languages.slice(0,3).map(x=><span key={x}>{x}</span>)}</div><div className="detail-genres">{movie.genres.join(' · ')}</div><Link className="button-primary book-cta" to={`/showtimes/${movie.movieId}`}>Book tickets <ArrowRight size={17}/></Link></div></div></section>
    <div className="shell detail-content"><section className="detail-section about-section"><h2>About the movie</h2><p>{movie.synopsis}</p><div className="about-meta"><div><span>Release date</span><b>{release}</b></div><div><span>Duration</span><b>{movie.duration} minutes</b></div><div><span>Languages</span><b>{movie.languages.join(', ')}</b></div><div><span>Certificate</span><b>{movie.certificate}</b></div></div></section>
      <section className="detail-section"><div className="section-heading"><div><h2>Cast</h2><p>Meet the people bringing this story to life.</p></div></div><div className="people-row">{movie.cast.map((person,i)=><PersonCard person={person} index={i} key={person.name}/>)}</div></section>
      <section className="detail-section"><div className="section-heading"><div><h2>Crew</h2><p>The creative team behind the camera.</p></div></div><div className="people-row">{movie.crew.map((person,i)=><PersonCard person={person} index={i+3} key={person.name}/>)}</div></section>
      <section className="detail-section reviews-section"><div className="section-heading"><div><h2>Top reviews</h2><p>What moviegoers are saying</p></div><button className="see-all" onClick={()=>onNotify('More reviews are coming soon')}>See all reviews <ChevronRight size={15}/></button></div><div className="review-grid">{[
        {name:'Riya S.',date:'A few days ago',text:`${movie.title} stays with you long after the credits. Beautifully made, and full of little moments that feel real.`,likes:128},
        {name:'Aditya M.',date:'Last week',text:'A lovely surprise from start to finish. The performances felt effortless and the music is still on repeat.',likes:76},
        {name:'Neha K.',date:'Last week',text:'Went in expecting a fun evening and came out wanting to call everyone I love. Highly recommend.',likes:54}
      ].map(review=><ReviewCard review={review} key={review.name}/>)}</div></section>
      {related.length>0&&<ContentSection title="You might also like" seeAll="See All" to="/movies" loaded><ScrollRow label="recommended movies">{related.map(item=><MovieCard movie={item} key={item.slug}/>)}</ScrollRow></ContentSection>}
    </div>
  </main>;
}

function PersonCard({person,index}) { const portraits=['photo-1534528741775-53994a69daeb','photo-1500648767791-00dcc994a43e','photo-1531123897727-8f129e1688ce','photo-1506794778202-cad84cf45f1d','photo-1544005313-94ddf0286df2','photo-1507003211169-0a1dd7228f2d'];return <article className="person-card"><img src={`https://images.unsplash.com/${portraits[index%portraits.length]}?auto=format&fit=crop&w=180&h=180&q=80`} alt={person.name} loading="lazy"/><b>{person.name}</b><span>{person.role}</span></article>; }
function ReviewCard({review}) { const [liked,setLiked]=useState(false);return <article className="review-card"><div className="reviewer"><span className="review-avatar">{review.name[0]}</span><div><b>{review.name}</b><small>{review.date}</small></div><span className="review-score"><Star size={12} fill="currentColor"/> 9/10</span></div><p>{review.text}</p><button className={liked?'review-like liked':'review-like'} onClick={()=>setLiked(!liked)} aria-pressed={liked}>♡ <span>{review.likes+(liked?1:0)} found this helpful</span></button></article>; }

function ExperienceListingPage({type}) {
  const {city}=useAppState();
  const config={event:{title:'Events',subtitle:'Make a plan for the moments worth remembering.',icon:'✦'},play:{title:'Plays',subtitle:'Stories that stay with you after the curtain falls.',icon:'🎭'},sports:{title:'Sports',subtitle:'Feel every moment. Cheer for every point.',icon:'🏟️'},activity:{title:'Activities',subtitle:'Try something new, close to home or far from ordinary.',icon:'☀️'}}[type];
  const [dateMode,setDateMode]=useState('all'),[fromDate,setFromDate]=useState(''),[toDate,setToDate]=useState(''),[priceRange,setPriceRange]=useState('all');
  const now=new Date(); const nextWeek=new Date(now);nextWeek.setDate(now.getDate()+7);
  const candidates=events.filter(event=>event.type===type).sort((a,b)=>Number(b.city===city)-Number(a.city===city));
  const filtered=candidates.filter(event=>{
    const day=event.startDate;let dateOk=true;
    if(dateMode==='weekend'){const sat=new Date(now);sat.setDate(now.getDate()+(6-now.getDay()+7)%7);const sun=new Date(sat);sun.setDate(sat.getDate()+1);const satKey=localDateKey(sat),sunKey=localDateKey(sun);dateOk=day>=satKey&&day<=sunKey;}
    if(dateMode==='week'){dateOk=day>=localDateKey(now)&&day<=localDateKey(nextWeek);}
    if(dateMode==='custom'){dateOk=(!fromDate||day>=fromDate)&&(!toDate||day<=toDate);}
    const amount=event.priceValue||0;
    const priceOk=priceRange==='all'||(priceRange==='under500'&&amount<500)||(priceRange==='500to1000'&&amount>=500&&amount<=1000)||(priceRange==='over1000'&&amount>1000);
    return dateOk&&priceOk;
  });
  const clear=()=>{setDateMode('all');setFromDate('');setToDate('');setPriceRange('all');};
  return <main className="experience-page shell"><div className="experience-hero"><div><span className="experience-eyebrow">DISCOVER SOMETHING GREAT IN {city.toUpperCase()}</span><h1>{config.title}</h1><p>{config.subtitle}</p></div><span className="experience-hero-art" aria-hidden="true">{config.icon}</span></div>
    <div className="experience-filter-panel"><div className="experience-filter-label"><b>Find your plan</b><span aria-live="polite">{filtered.length} experiences</span></div><div className="experience-filter-controls"><label>Date<select value={dateMode} onChange={e=>setDateMode(e.target.value)}><option value="all">Any date</option><option value="weekend">This weekend</option><option value="week">Next 7 days</option><option value="custom">Choose dates</option></select></label><label>Price<select value={priceRange} onChange={e=>setPriceRange(e.target.value)}><option value="all">Any price</option><option value="under500">Under ₹500</option><option value="500to1000">₹500 – ₹1,000</option><option value="over1000">₹1,000+</option></select></label>{(dateMode==='custom')&&<><label>From<input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label>To<input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label></>}{(dateMode!=='all'||priceRange!=='all')&&<button className="experience-clear" onClick={clear}>Clear filters</button>}</div></div>
    {filtered.length?<div className="experience-grid">{filtered.map(event=><EventCard event={event} key={event.id}/>)}</div>:<div className="experience-empty"><span>{config.icon}</span><h2>No plans found for those filters</h2><p>Try a different date or price range.</p><button onClick={clear}>Clear filters</button></div>}
  </main>;
}

function UserProfilePage({user,onSave,onNotify}) {
  const [name,setName]=useState(user.name||'');const [email,setEmail]=useState(user.email||'');const [phone,setPhone]=useState((user.phone||'').replace('+91 ','').replace(/\D/g,''));const [saved,setSaved]=useState(false);const [errors,setErrors]=useState({});
  const submit=e=>{e.preventDefault();const next={};if(name.trim().length<2)next.name='Please enter at least 2 characters.';if(email&&!/^\S+@\S+\.\S+$/.test(email))next.email='Enter a valid email address.';if(phone&&phone.length!==10)next.phone='Enter a valid 10-digit number.';setErrors(next);if(Object.keys(next).length){setSaved(false);return;}onSave({...user,name:name.trim(),email:email.trim(),phone:phone?`+91 ${phone}`:user.phone});setSaved(true);onNotify('Profile details saved');};
  return <main className="profile-page shell"><div className="account-heading"><div><span className="eyebrow">YOUR SHOWTIME ACCOUNT</span><h1>Your profile</h1><p>Manage your details and keep your tickets close.</p></div><Link to="/bookings" className="account-link"><Bookmark size={15}/> My bookings</Link></div><div className="profile-layout"><aside className="profile-card"><span className="profile-avatar-large">{(name||user.phone||'S')[0].toUpperCase()}</span><b>{name||'ShowTime guest'}</b><span>{email||user.phone}</span><span className="member-since"><Sparkles size={13}/> ShowTime member</span></aside><form className="profile-form" onSubmit={submit} noValidate><h2>Personal information</h2><p>Keep your contact details up to date for ticket confirmations.</p><label>Full name<input value={name} onChange={e=>{setName(e.target.value);setSaved(false);setErrors(s=>({...s,name:''}));}} placeholder="Your name" autoComplete="name" aria-invalid={Boolean(errors.name)}/>{errors.name&&<small className="profile-error">{errors.name}</small>}</label><label>Email address<input type="email" value={email} onChange={e=>{setEmail(e.target.value);setSaved(false);setErrors(s=>({...s,email:''}));}} placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(errors.email)}/>{errors.email&&<small className="profile-error">{errors.email}</small>}</label><label>Mobile number<div className="profile-phone"><span>🇮🇳 +91</span><input inputMode="numeric" maxLength={10} value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,'').slice(0,10));setSaved(false);setErrors(s=>({...s,phone:''}));}} placeholder="10-digit mobile number" autoComplete="tel-national" aria-invalid={Boolean(errors.phone)}/></div>{errors.phone&&<small className="profile-error">{errors.phone}</small>}</label><div className="profile-form-actions">{saved&&<span><Check size={14}/> Saved</span>}<button className="button-primary" type="submit">Save changes</button></div></form></div></main>;
}

function BookingsPage({onNotify}) {
  const navigate=useNavigate();const bookings=readBookings();
  return <main className="bookings-page shell"><div className="account-heading"><div><span className="eyebrow">YOUR SHOWTIME ACCOUNT</span><h1>My bookings</h1><p>Your tickets and plans, all in one place.</p></div><Link to="/profile" className="account-link"><UserCircle size={15}/> Profile</Link></div>{bookings.length?<div className="booking-history">{bookings.map(booking=><article className="history-card" key={booking.bookingId}><img src={booking.poster} alt=""/><div className="history-main"><div className="history-status"><span><Check size={12}/> Confirmed</span><small>{new Date(booking.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></div><h2>{booking.movieTitle}</h2><p>{booking.cinemaName} · {booking.city}</p><p>{booking.dateLabel} · {booking.time}</p><div className="history-seats">Seats: <b>{booking.seats.join(', ')}</b></div></div><div className="history-actions"><b>₹{Number(booking.total).toFixed(2)}</b><button onClick={()=>navigate(`/confirmation/${booking.bookingId}`)}>View ticket <ArrowRight size={14}/></button></div></article>)}</div>:<div className="bookings-empty"><span><TicketCheck size={27}/></span><h2>No bookings yet</h2><p>When you book tickets, they’ll be waiting for you here.</p><Link to="/movies" className="button-primary">Explore movies <ArrowRight size={15}/></Link><button className="booking-help" onClick={()=>onNotify('You can book movies, events and more from ShowTime')}>Need help?</button></div>}</main>;
}

function StreamPage() {
  const [genre,setGenre]=useState('All');const [preview,setPreview]=useState(null);
  const genres=['All',...new Set(streamTitles.map(item=>item.genre))];
  const filtered=genre==='All'?streamTitles:streamTitles.filter(item=>item.genre===genre);
  return <main className="phase6-page stream-page shell">
    <section className="stream-hero"><div className="stream-hero-copy"><span className="phase6-eyebrow"><Play size={13} fill="currentColor"/> SHOWTIME STREAM</span><h1>Big stories.<br/><em>Right from home.</em></h1><p>Discover original films and fresh premieres, picked for your next night in.</p><a className="phase6-primary" href="#stream-library">Explore the collection <ArrowRight size={16}/></a></div><div className="stream-hero-art" aria-hidden="true"><span className="stream-art-glow"/><span className="stream-art-poster"><span>SHOWTIME<br/>ORIGINALS</span><b>ST</b></span><span className="stream-art-caption">A story for every mood</span></div><span className="stream-hero-orbit orbit-one"/><span className="stream-hero-orbit orbit-two"/></section>
    <div className="phase6-section-heading" id="stream-library"><div><span className="phase6-eyebrow">YOUR NEXT FAVOURITE</span><h2>Stories to stay in for</h2><p>Handpicked ShowTime originals and new premieres.</p></div><span className="phase6-count">{filtered.length} titles</span></div>
    <div className="phase6-chips" aria-label="Filter by genre">{genres.map(item=><button key={item} className={genre===item?'selected':''} aria-pressed={genre===item} onClick={()=>setGenre(item)}>{item}</button>)}</div>
    <div className="stream-grid">{filtered.map((item,index)=><article className="stream-title-card" key={item.id}><button className="stream-poster-button" onClick={()=>setPreview(item)} aria-label={`Preview ${item.title}`}><img src={item.image} alt={`${item.title} artwork`} loading="lazy"/><span className="stream-poster-vignette"/><span className="stream-title-tag">{item.tag}</span><span className="stream-play-button"><Play size={19} fill="currentColor"/></span><span className="stream-poster-index">0{index+1}</span></button><div className="stream-title-info"><div><span>{item.genre} <i/> {item.year} <i/> {item.runtime}</span><h3>{item.title}</h3></div><span className="stream-rating"><Star size={13} fill="currentColor"/>{item.rating}</span></div><p>{item.description}</p></article>)}</div>
    <Modal open={Boolean(preview)} title={preview?.title||'Preview'} onClose={()=>setPreview(null)}>{preview&&<div className="stream-preview"><div className="stream-preview-art" style={{backgroundImage:`linear-gradient(0deg,rgba(20,22,35,.62),transparent 68%),url("${preview.image}")`}}><span><Play size={22} fill="currentColor"/></span><small>SHOWTIME ORIGINAL · {preview.genre.toUpperCase()}</small></div><p>{preview.description}</p><div className="stream-preview-meta"><span>{preview.year}</span><span>{preview.runtime}</span><span><Star size={13} fill="currentColor"/> {preview.rating} audience score</span></div><div className="stream-preview-note"><Sparkles size={15}/> Preview mode — full streaming is coming soon.</div></div>}</Modal>
  </main>;
}

function OffersPage({onNotify}) {
  const [category,setCategory]=useState('All');const [copied,setCopied]=useState('');
  const categories=['All','Movies','Events','Experiences'];const filtered=category==='All'?offers:offers.filter(offer=>offer.category===category);
  const copyCode=async(code)=>{try{await navigator.clipboard.writeText(code);setCopied(code);window.setTimeout(()=>setCopied(''),1800);onNotify(`${code} copied — add it at checkout`);}catch{onNotify(`Use code ${code} at checkout`);}};
  return <main className="phase6-page offers-page shell"><section className="offers-hero"><div><span className="phase6-eyebrow"><BadgePercent size={14}/> A LITTLE EXTRA FOR YOUR PLANS</span><h1>Good times,<br/><em>better deals.</em></h1><p>Find a little something off your next movie night, live show or day out.</p></div><div className="offers-hero-art" aria-hidden="true"><span className="offer-ticket"><BadgePercent size={40}/><b>MORE<br/>MOMENTS</b></span><span className="offer-spark spark-a">✦</span><span className="offer-spark spark-b">✧</span></div></section>
    <div className="phase6-section-heading offers-heading"><div><span className="phase6-eyebrow">MADE FOR YOUR NEXT PLAN</span><h2>Offers worth opening</h2><p>Pick an offer, copy the code and apply it at checkout.</p></div><span className="phase6-count">{filtered.length} offers</span></div>
    <div className="phase6-chips" aria-label="Filter offers">{categories.map(item=><button key={item} className={category===item?'selected':''} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>
    {filtered.length?<div className="offers-grid">{filtered.map(offer=><article className={`deal-card deal-${offer.tone}`} key={offer.id}><div className="deal-card-top"><span className="deal-partner">{offer.partner}</span><span className="deal-badge">{offer.badge}</span></div><span className="deal-icon"><BadgePercent size={23}/></span><h3>{offer.title}</h3><p>{offer.description}</p><div className="deal-terms"><Clock3 size={13}/>{offer.terms}</div><div className="deal-code-row"><div><small>USE CODE</small><b>{offer.code}</b></div><button onClick={()=>copyCode(offer.code)} aria-label={`Copy offer code ${offer.code}`}>{copied===offer.code?<><Check size={15}/> Copied</>:<><Copy size={14}/> Copy code</>}</button></div></article>)}</div>:<div className="phase6-empty"><Sparkles size={24}/><h2>No offers in this category</h2><button onClick={()=>setCategory('All')}>See all offers</button></div>}
    <div className="offers-footnote"><span><Check size={15}/></span><p>All offers are mock promotions for this demo. Terms and eligibility vary by offer; apply a code during checkout to see the discount.</p></div>
  </main>;
}

function PlaceholderPage({ title, subtitle }) { return <main className="shell placeholder-page"><div className="placeholder-icon"><Clapperboard size={27}/></div><div className="eyebrow">SHOWTIME</div><h1>{title}</h1><p>{subtitle}</p><div className="coming-soon"><Sparkles size={16}/> More to discover soon</div></main>; }
function NotFoundPage() { return <main className="shell placeholder-page"><div className="placeholder-icon"><Search size={26}/></div><div className="eyebrow">404 · PAGE NOT FOUND</div><h1>That page took a detour.</h1><p>The link may have moved, or the page may no longer be here.</p><Link to="/" className="button-primary" style={{marginTop:22}}>Back to home <ArrowRight size={16}/></Link></main>; }
function SignInPrompt({ onSignIn }) { return <main className="shell placeholder-page"><div className="placeholder-icon"><UserRound size={26}/></div><h1>Sign in to continue</h1><p>Keep your bookings and account details in one place.</p><button className="button-primary" onClick={onSignIn}>Sign in <ArrowRight size={16}/></button></main>; }

function CityPicker({ city, onSelect, onNotify }) {
  const [query, setQuery] = useState(''); const [showAll, setShowAll] = useState(false);
  const filtered = cities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const shown = query ? filtered : showAll ? cities : popular;
  return <div className="city-picker"><label className="modal-search"><Search size={17}/><input autoFocus placeholder="Search for your city" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <div className="detect-row"><button onClick={() => onNotify('Location detection is unavailable in this preview')}><LocateFixed size={17}/> Detect my location</button><span>Choose your city to see what’s on nearby</span></div>
    <h3>{query ? 'Matching cities' : 'Popular cities'}</h3>
    <div className="city-grid">{shown.map(c => <button key={c.name} className={`city-option ${city === c.name ? 'city-selected' : ''}`} onClick={() => onSelect(c.name)}><span className="city-emoji">{c.icon}</span><span>{c.name}</span>{city === c.name && <Check size={14} className="city-check"/>}</button>)}</div>
    {!query && <button className="view-cities" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show popular cities' : 'View all cities'} <ChevronDown size={15} className={showAll ? 'rotate' : ''}/></button>}
    {query && !shown.length && <div className="no-results city-empty">We couldn’t find that city. Try a nearby metro.</div>}
  </div>;
}

function AuthFlow({ onComplete, onNotify }) {
  const [step, setStep] = useState('phone'); const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [error, setError] = useState('');
  const continuePhone = e => { e.preventDefault(); if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit mobile number'); return; } setError(''); setStep('otp'); };
  const complete = e => { e.preventDefault(); if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code to continue'); return; } onComplete({ phone: `+91 ${phone}` }); };
  return <div className="auth-content">{step === 'phone' ? <><div className="auth-brand"><span className="auth-brand-icon"><Clapperboard size={22}/></span><div><b>Welcome to ShowTime</b><small>Sign in for a smoother experience</small></div></div><form onSubmit={continuePhone} noValidate><label className="field-label" htmlFor="phone">Mobile number</label><div className="phone-field"><span className="country-code">🇮🇳 +91</span><input id="phone" autoFocus inputMode="numeric" maxLength={10} value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }} placeholder="10-digit mobile number"/><Phone size={17}/></div>{error && <div className="field-error">{error}</div>}<button className="button-primary auth-submit" type="submit">Continue <ArrowRight size={17}/></button></form><div className="auth-divider"><span/>or continue with<span/></div><div className="auth-alternatives"><button onClick={() => onNotify('Google sign-in is mocked in this preview')}><span className="google-mark">G</span> Google</button><button onClick={() => { setStep('email'); setError(''); }}><Mail size={17}/> Email</button></div><p className="terms-copy">By continuing, you agree to our <a href="#terms" onClick={e => { e.preventDefault(); onNotify('Terms & Conditions'); }}>Terms & Conditions</a> and <a href="#privacy" onClick={e => { e.preventDefault(); onNotify('Privacy Policy'); }}>Privacy Policy</a>.</p></> : step === 'otp' ? <form onSubmit={complete} noValidate><button className="back-link" type="button" onClick={() => { setStep('phone'); setError(''); }}>← Change number</button><div className="auth-step-icon"><Phone size={21}/></div><h3>Verify your number</h3><p className="auth-hint">Enter the 6-digit code sent to <b>+91 {phone}</b></p><label className="field-label" htmlFor="otp">One-time password</label><input className="otp-input" id="otp" autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} placeholder="• • • • • •"/>{error && <div className="field-error">{error}</div>}<button className="button-primary auth-submit" type="submit">Verify & continue <ArrowRight size={17}/></button><button className="resend-code" type="button" onClick={() => onNotify('A new demo OTP is on its way')}>Resend code</button></form> : <form onSubmit={e => { e.preventDefault(); const email = e.target.email.value.trim(); if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address'); return; } onComplete({ name: email.split('@')[0], email }); }} noValidate><button className="back-link" type="button" onClick={() => setStep('phone')}>← Back to sign in options</button><div className="auth-step-icon"><Mail size={21}/></div><h3>Continue with email</h3><p className="auth-hint">We’ll keep your tickets together in one place.</p><label className="field-label" htmlFor="email">Email address</label><input className="email-input" id="email" name="email" autoFocus type="email" placeholder="you@example.com"/>{error && <div className="field-error">{error}</div>}<button className="button-primary auth-submit" type="submit">Continue <ArrowRight size={17}/></button></form>}</div>;
}

function Modal({ open, title, onClose, children }) {
  const dialogRef = useRef(null); const closeRef = useRef(null);
  useEffect(() => { if (!open) return; const prior = document.activeElement; document.body.classList.add('modal-open'); closeRef.current?.focus(); const key = e => { if (e.key === 'Escape') onClose(); if (e.key === 'Tab' && dialogRef.current) { const items = [...dialogRef.current.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')]; if (!items.length) return; const first = items[0], last = items[items.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }; document.addEventListener('keydown', key); return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', key); prior?.focus?.(); }; }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section ref={dialogRef} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-heading"><h2 id="dialog-title">{title}</h2><button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={19}/></button></div>{children}</section></div>;
}

function Footer({ onAction }) {
  const actions = [{ icon: <HeartHandshake/>, title: '24/7 Customer Care', text: 'We’re here whenever you need us' }, { icon: <RotateCcw/>, title: 'Resend Booking Confirmation', text: 'Your tickets, right where you need them' }, { icon: <BellRing/>, title: 'Subscribe to the Newsletter', text: 'Get the best of your city in your inbox' }];
  const columns = [
    ['Movies Now Showing', 'Latest Releases', 'Popular Movies', 'Coming Soon', 'Movie Reviews'],
    ['Upcoming Movies', 'Hindi Movies', 'English Movies', 'Regional Movies', 'Browse by Genre'],
    ['Top Movies', 'Top Rated Movies', 'Trending Movies', 'Classic Picks', 'All Movies'],
    ['Cinemas', 'Cinemas Near You', 'Premium Screens', 'Movie Experiences', 'Theatre Guide'],
    ['Events', 'Music Shows', 'Comedy Shows', 'Workshops', 'Food & Drink'],
    ['Plays', 'Sports', 'Activities', 'Offers', 'Gift Cards'],
  ];
  return <footer className="footer"><div className="footer-service"><div className="shell service-row">{actions.map((item, i) => <button key={item.title} className="service-item" onClick={() => onAction(i === 1 ? 'Enter your booking details to resend a confirmation' : i === 2 ? 'Newsletter sign-up is coming soon' : 'Customer care is here to help')}><span className="service-icon">{item.icon}</span><span><b>{item.title}</b><small>{item.text}</small></span></button>)}</div></div><div className="shell footer-links">{columns.map((col, i) => <div className="footer-column" key={i}><h3>{col[0]}</h3>{col.slice(1).map(label => <Link key={label} to={label === 'Offers' ? '/offers' : `/${label.toLowerCase().replaceAll(' ', '-')}`} onClick={e => { if (!['Offers'].includes(label)) { e.preventDefault(); onAction(`${label} is coming soon`); } }}>{label}</Link>)}</div>)}</div><div className="footer-bottom"><div className="shell footer-bottom-inner"><Link to="/" className="footer-logo"><span>show</span>time</Link><div className="social-row"><button aria-label="Instagram" onClick={() => onAction('Find us on Instagram')}><Camera/></button><button aria-label="Facebook" onClick={() => onAction('Find us on Facebook')}><UsersRound/></button><button aria-label="YouTube" onClick={() => onAction('Find us on YouTube')}><PlaySquare/></button></div><div className="footer-legal"><span>© 2026 ShowTime Entertainment. All rights reserved.</span><div><a href="#help" onClick={e => { e.preventDefault(); onAction('Help centre is coming soon'); }}>Help</a><a href="#terms" onClick={e => { e.preventDefault(); onAction('Terms & Conditions'); }}>Terms &amp; Conditions</a><a href="#privacy" onClick={e => { e.preventDefault(); onAction('Privacy Policy'); }}>Privacy Policy</a></div></div></div></div></footer>;
}

export default App;
