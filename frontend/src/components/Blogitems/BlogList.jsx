const BlogList = () => {
    // Mock data, replace with actual data fetch/logic
    const blogs = [
      { title: "Sample Blog 1", category: "Finances" },
      { title: "Sample Blog 2", category: "Campus Life" },
      // Add more blogs
    ];
  
    return (
      <div className="grid grid-cols-3 gap-4 p-4">
        {blogs.map(blog => (
          <div key={blog.title} className="p-4 border border-gray-300 shadow hover:shadow-lg transition duration-200 ease-in-out">
            <h3 className="font-bold">{blog.title}</h3>
            <p>{blog.category}</p>
          </div>
        ))}
      </div>
    );
  }
  
  export default BlogList;