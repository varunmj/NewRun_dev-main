import React from 'react';
import Navbar from '..//components/Navbar/Navbar'
import {
  Avatar,
  Card,
  Button,
  Badge,
  Divider,
  Tooltip,
} from '@heroui/react';


const UserProfile = () => {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    university: 'Harvard University',
    major: 'Computer Science',
    graduation: '2025',
    bio: 'Passionate about building innovative tech solutions to make life easier for students.',
    followers: 1200,
    following: 800,
    tasksCompleted: 42,
    profilePic:
      'https://via.placeholder.com/150',
  };

  return (
    <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#2c2c2c] text-white">
        {/* Profile Header */}
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between">
            {/* Profile Information */}
            <div className="flex items-center space-x-6">
                <Avatar
                src={user.profilePic}
                size="xl"
                alt="Profile Picture"
                className="rounded-full"
                />
                <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-sm">{user.email}</p>
                <p className="text-sm text-gray-400">
                    {user.university}, {user.major}
                </p>
                <Badge color="success" size="lg" shape="circle" placement="bottom-right">
                    Available for Projects
                </Badge>
                </div>
            </div>
            {/* Contact Button */}
            <div className="flex space-x-4">
                <Button auto className="bg-blue-500 hover:bg-blue-600">
                Contact Me
                </Button>
                <Button auto className="bg-red-500 hover:bg-red-600">
                Schedule Call
                </Button>
            </div>
            </div>

            {/* About Section */}
            <Card className="my-8 bg-white">
            <div className="p-4">
                <h3 className="text-xl font-semibold mb-4">About Me</h3>
                <p className="text-gray-400">{user.bio}</p>
            </div>
            </Card>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 ">
            <Card className="bg-white">
                <div className="p-6 text-center">
                <h3 className="text-xl font-bold">{user.tasksCompleted}</h3>
                <p className="text-gray-400">Completed Tasks</p>
                </div>
            </Card>
            <Card className="bg-white">
                <div className="p-6 text-center">
                <h3 className="text-xl font-bold">{user.followers}</h3>
                <p className="text-gray-400">Followers</p>
                </div>
            </Card>
            <Card className="bg-white">
                <div className="p-6 text-center">
                <h3 className="text-xl font-bold">{user.following}</h3>
                <p className="text-gray-400">Following</p>
                </div>
            </Card>
            </div>

            {/* Education & Work Experience */}
            <div className="grid grid-cols-2 gap-6 my-8">
            <Card className="bg-white">
                <div className="p-6">
                <h3 className="text-xl font-semibold">Education</h3>
                <p className="text-gray-400">{user.university}</p>
                <p className="text-gray-400">{user.major}</p>
                <p className="text-gray-400">Graduation: {user.graduation}</p>
                </div>
            </Card>
            <Card className="bg-white">
                <div className="p-6">
                <h3 className="text-xl font-semibold">Work Experience</h3>
                <p className="text-gray-400">Founder at NewRun</p>
                <p className="text-gray-400">
                    Developing a platform to help students transition seamlessly into
                    university life.
                </p>
                </div>
            </Card>
            </div>

            {/* Social Stats */}
            <div className="grid grid-cols-2 gap-6 my-8">
            <Card className="bg-white">
                <div className="p-6">
                <h3 className="text-xl font-semibold">My Top 4 Stacks</h3>
                <div className="flex flex-wrap mt-4 space-x-4">
                    <Tooltip content="JavaScript">
                    <Button auto light>
                        JavaScript
                    </Button>
                    </Tooltip>
                    <Tooltip content="React">
                    <Button auto light>
                        React
                    </Button>
                    </Tooltip>
                    <Tooltip content="Node.js">
                    <Button auto light>
                        Node.js
                    </Button>
                    </Tooltip>
                    <Tooltip content="AWS">
                    <Button auto light>
                        AWS
                    </Button>
                    </Tooltip>
                </div>
                </div>
            </Card>
            <Card className="bg-white">
                <div className="p-6 text-center">
                <h3 className="text-xl font-semibold">Have an Idea?</h3>
                <p className="text-gray-400 mt-2">Let's work together!</p>
                <Button className="mt-4 bg-green-500">Collaborate</Button>
                </div>
            </Card>
            </div>
        </div>
        </div>
    </div>
  );
};

export default UserProfile;
