const TopicBar = () => {
    const topics = ["Campus Life", "Finances", "Career", "Visas", "Housing", "Well Being", "Culture", "Communication", "City Life"];
    return (
      <div className="flex justify-around p-4 bg-gray-200">
        {topics.map(topic => (
          <button key={topic} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {topic}
          </button>
        ))}
      </div>
    );
  }
  
  export default TopicBar;