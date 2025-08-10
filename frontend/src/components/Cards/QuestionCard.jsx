import React from 'react'

const QuestionCard = ({ user, question }) => {
        return (
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md m-2">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
            <h3 className="mt-2 font-semibold">@{user.username}</h3>
            <p className="text-sm text-gray-600">{question}</p>
          </div>
        );
      };

export default QuestionCard