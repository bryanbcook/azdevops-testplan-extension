namespace MSTestExample.Attachments
{
  [TestClass]
  public class UnitTest1
  {
    public TestContext TestContext { get; set; }

    [TestMethod]
    public void TestCase4846_MSTest_SingleAttachment()
    {
      var fileName = "4846.txt";
      File.WriteAllText(fileName, "Test 1");

      TestContext.AddResultFile(fileName);
    }

    [TestMethod]
    public void TestCase4847_MSTest_MultipleAttachments()
    {
      var fileName1 = "4847-1.txt";
      var fileName2 = "4847-2.txt";
      File.WriteAllText(fileName1, "Test 1");
      File.WriteAllText(fileName2, "Test 1");

      TestContext.AddResultFile(fileName1);
      TestContext.AddResultFile(fileName2);
    }
  }
}