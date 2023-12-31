import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { host } from "../util/apiRoutes";
import { isMongoDBId } from "../util/isMongodbId";
import { useAuthContext } from "../hooks/useAuthContext";

import { ExperienceCard } from "../components/PipelineCard";

import { MapPin, PencilLine } from 'lucide-react';
import Loading from "./Loading";

function Profile () {
    const { id } = useParams();
    const [profile, setProfile] = useState({});
    
    // for searching through profiles that have
    // id as a username instead of id
    const [profiles, setProfiles] = useState([]);

    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);

    const [saveable, setSaveable] = useState(false);

    const [username, setUsername] = useState('');
    const [usernameErrorMessage, setUsernameErrorMessage] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [linkedinErrorMessage, setLinkedinErrorMessage] = useState('');

    const [location, setLocation] = useState('');

    const hasError = 
        usernameErrorMessage.length !== 0 &&
        linkedinErrorMessage.length !== 0;

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const isValidId = await isMongoDBId(id);
    
            if (isValidId) {
                const response = await fetch(`${host}/api/profile/${id}`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
    
                if (!response.ok) {
                    // Check if the response has JSON content
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        const errorData = await response.json();
                        throw new Error(`${errorData.error}`);
                    } else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }
    
                const data = await response.json();
                setProfile(data);
    
                setUsername(data.username);
                setLinkedin(extractLinkedinUsername(data.linkedin));
                setLocation(data.location);
    
                setLoading(false);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error(error.message);
            setProfile(null);
            setLoading(false);
        }
    };

    const fetchProfiles = async () => {

        fetch(`${host}/api/profile/`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json' // Specify the content type as JSON
            }
        })
        .then((res) => {
            if (!res.ok) {
                // Check if the response has JSON content
                if (res.headers.get('content-type')?.includes('application/json')) {
                    return res.json().then((errorData) => {
                        throw new Error(`${errorData.error}`);
                    });
                } else {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
            }

            return res.json();
        })
        .then((data) => {
            setProfiles(data);
        })
        .catch((error) => {
            console.error(error.message);
        });

    }

    const validateUsername = async (username) => {
        const isValidUsername = async (username) => {
            const mongodbConflict = await isMongoDBId(username);
            const usernameRegex = /^[a-zA-Z0-9_](?!.*[._]{2})[a-zA-Z0-9_.]{1,30}[a-zA-Z0-9_]$/;;
            return !mongodbConflict && usernameRegex.test(username);
        }

        const isAvailable = (username) => {
            const filteredProfiles = profiles.filter((profile) =>
                profile.username.toLowerCase() === username.toLowerCase()
            );

            // check if the one profile there is the current user's
            if (filteredProfiles.length === 1) {
                const filteredProfile = filteredProfiles[0];

                return profile.username === filteredProfile.username;
            }

            return filteredProfiles.length === 0;
        }

        // blank username
        if (username.length === 0) {
            setUsernameErrorMessage("Invalid username.");
            return false;
        }

        // contains '/'
        if (username.indexOf("/") !== -1) {
            setUsernameErrorMessage("Invalid username.");
            return false;
        }

        // invalid regex
        else if (!(await isValidUsername(username))) {
            setUsernameErrorMessage("Invalid username.");
            return false;
        }

        // taken username
        else if (!isAvailable(username)) {
            setUsernameErrorMessage("Username already taken.");
            return false;
        }

        // valid username
        else {
            setUsernameErrorMessage('');
            return true;
        }
    }

    const validateLinkedin = async (linkedin) => {
        // Regular expression for a basic LinkedIn username check
        const regex = /^[a-z0-9-]+$/i;
    
        // Check if the username matches the pattern
        if (!regex.test(linkedin)) {
            setLinkedinErrorMessage('Invalid Linkedin username.');
            return false;
        } else {
            setLinkedinErrorMessage('');
            return true;
        }
    }

    const extractLinkedinUsername = (linkedin) => {
        const regex = /https:\/\/linkedin\.com\/in\/([^/]+)/;
        const match = linkedin.match(regex);
    
        // Check if the regex matched and has the expected parts
        if (match && match[1]) {
            return match[1];
        }
    
        // If no match, return null or handle it according to your requirements
        return null;
    }

    const buildLinkedinUrl = (username) => {
        const baseLinkedinUrl = "https://linkedin.com/in/";
        return `${baseLinkedinUrl}${username}`;
    }

    const handleUsernameChange = async (e) => {
        // change -> saveable progress
        setSaveable(true);

        // remove previous errors
        setUsernameErrorMessage('');

        const value = e.target.value;
        setUsername(value);
    }

    const handleLinkedinChange = async (e) => {
        // change -> saveable progress
        setSaveable(true);

        // remove previous errors
        setLinkedinErrorMessage('');

        const value = e.target.value;
        setLinkedin(value);
    }

    const handleLocationChange = async(e) => {
        // change -> saveable progress
        setSaveable(true);

        const value = e.target.value;
        setLocation(value);
    }

    const handleEditProfile = async () => {
        const updatedProfile = {
            username: username,
            linkedin: buildLinkedinUrl(linkedin),
            location: location
        };
        
        // check all fields are filled out
        if (!username || username.length === 0) {
            setUsernameErrorMessage('All fields must be filled.')
            return;
        }

        if (!linkedin || linkedin.length === 0) {
            // clear linkedin if user left blank / deleted
            updatedProfile.linkedin = '';
        }

        if (!location || location.length === 0) {
            // clear location if user left blank / deleted
            updatedProfile.location = '';
        }

        // field validation
        if (!validateUsername(username)) {
            return;
        }

        if (!validateLinkedin(linkedin)) {
            return;
        }
    
        try {
            const response = await fetch(`${host}/api/profile/${user.profileId}`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json' // Specify the content type as JSON
                },
                body: JSON.stringify(updatedProfile)
            });
    
            if (!response.ok) {
                // Check if the response has JSON content
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(`${errorData.error}`);
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            }
            
            const data = await response.json();
            console.log(data);
            
        } catch (error) {
            console.error(error.message);
        }
    
        setSaveable(false);
    };
 
    useEffect(() => {
        const fetchInfo = async () => {
            await fetchProfile();
            await fetchProfiles();
        }

        fetchInfo();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const admin = user && (user.profileId === id || user.username === id);

    if (loading) {
        return <Loading />
    }

    return (
        <>

            { profile && !profile.anonymous ? (
                    <div className="flex flex-row justify-center items-center w-full h-full p-16 gap-10">
                        
                        {/* Profile picture + few fields */}
                        <div className="flex flex-col justify-center items-center bg-white w-1/3 h-full p-10 gap-5 shadow-md">
                            
                            { admin ? (
                                    <div className="relative w-96 h-96 rounded-full overflow-hidden">
                                        <img 
                                            src={"/avatar.png"}
                                            className="w-full h-full object-cover rounded-full transition-transform transform hover:scale-105"
                                            alt={`${profile._id}_avatar`}
                                        />
                                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100">
                                            <PencilLine 
                                                className="w-12 h-12 text-gray-200 hover:text-gray-300 transition-transform transform hover:scale-110 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <img 
                                        src={"/avatar.png"}
                                        className="w-96 h-96 rounded-full"
                                        alt={`${profile._id}_avatar`}
                                    />
                                )
                            }

                            { admin ? (
                                <div className="flex flex-col justify-center items-center gap-3">
                                    <label>Username</label>
                                    <input
                                        className="p-3 bg-gray-100 rounded-full"
                                        value={username}
                                        onChange={handleUsernameChange}
                                    />
                                    { usernameErrorMessage &&
                                        <h1 className="text-red-400">{usernameErrorMessage}</h1>
                                    }

                                    <label>Linkedin</label>
                                    <div className="flex flex-row justify-center items-center gap-2">
                                        <h1>linkedin.com/in/</h1>
                                        <input
                                            className="p-3 bg-gray-100 rounded-full"
                                            value={linkedin}
                                            onChange={handleLinkedinChange}
                                        />
                                    </div>
                                    { linkedinErrorMessage &&
                                        <h1 className="text-red-400">{linkedinErrorMessage}</h1>
                                    }

                                    <div className="h-4"/>

                                    { saveable && !hasError ? (
                                        <button 
                                            className={"bg-black px-12 py-1 rounded-full"}
                                            onClick={handleEditProfile}
                                        >
                                            <h1 className="text-white font-normal uppercase">Save</h1>
                                        </button>
                                    ) : (
                                        <div className="h-8"/>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center gap-3">
                                    <label className="text-black font-medium">Username</label>
                                    <h1>{username}</h1>

                                    <label className="text-black font-medium">Linkedin</label>
                                    <Link
                                        to={buildLinkedinUrl(linkedin)}
                                        target="_blank"
                                    >
                                        <h1 className="hover:underline">{linkedin}</h1>
                                    </Link>
                                </div>
                            )}
                        </div>
                        
                        {/* Name + job info */}
                        <div className="flex flex-col justify-center items-start w-1/3 h-full gap-3">
                            <h1 className="text-black font-semibold text-2xl">{profile.firstName} {profile.lastName}</h1>

                            <div className="flex justify-center items-center w-24 h-8 bg-gray-200 border-gray-500 border-2 rounded-full">
                                <h1 className="text-gray-800 font-semibold">Intern</h1>
                            </div>
                            
                            { profile.pipeline && profile.pipeline.length > 0 && 
                                <h1>{profile.pipeline[0].title} at <span className="font-medium">{profile.pipeline[0].company}</span></h1>
                            }
                            
                            <div className="flex flex-row justify-center items-center gap-2">
                                <MapPin />
                                { admin ? (
                                        <input
                                            className="p-3 bg-white rounded-full"
                                            value={location}
                                            onChange={handleLocationChange}
                                        />
                                    ) : (
                                        <h1 className="italic">{location}</h1>
                                    )
                                }
                            </div>
                        </div>
                        
                        {/* Pipeline */}
                        <div className="flex flex-col justify-center items-center w-1/3 h-full bg-white p-10 gap-3">
                        { profile.pipeline &&
                            profile.pipeline.map((experience, i) => (
                                <div className='flex flex-col justify-center items-center gap-3' key={experience._id}>
                                    <ExperienceCard experience={experience} />
                                    {
                                        (i !== profile.pipeline.length - 1) ? (<h1>--</h1>) : (<></>)
                                    }
                                </div>
                            ))
                        }
                        </div>
                        
                    </div>
                ) : (
                    <div className="flex flex-row justify-center items-center w-full h-full p-16">
                        <h1 className="text-black font-bold text-4xl">404 Profile Not Found.</h1>
                    </div>
                )
            }
        </>
    );
}

export default Profile;